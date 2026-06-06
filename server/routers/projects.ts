import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import {
  getUserProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  createProjectShare,
  getProjectShareByToken,
} from "../db";
import { storagePut } from "../storage";
import {
  detectDrivewayEdges,
  calculateSquareFeetFromCorners,
} from "../services/edgeDetection";
import {
  getMaterialPricingForZip,
  calculateMaterialQuantity,
  calculateTotalCost,
  MATERIALS,
  normalizeZipCode,
} from "../services/pricing";
import {
  buildStoredPhotoName,
  decodePhotoBase64,
  isSupportedPhotoMimeType,
} from "../services/photoUpload";
import {
  sendEstimateNotification,
  sendContractorNotification,
} from "../services/email";
import { generateImage } from "../_core/imageGeneration";
import { reverseGeocodeToZip } from "../services/geolocation";
import type { Request } from "express";
import type { Project } from "../../drizzle/schema";

function getRequestOrigin(req: Request) {
  const forwardedProto = req.headers["x-forwarded-proto"];
  const forwardedHost = req.headers["x-forwarded-host"];
  const proto = Array.isArray(forwardedProto)
    ? forwardedProto[0]
    : forwardedProto?.split(",")[0];
  const host = Array.isArray(forwardedHost)
    ? forwardedHost[0]
    : forwardedHost?.split(",")[0] || req.headers.host;
  const scheme = (proto || req.protocol || "http").trim();

  if (!host) return "";

  return `${scheme}://${host.trim()}`;
}

function toAbsoluteUrl(req: Request, url: string) {
  if (/^https?:\/\//i.test(url)) return url;

  const origin = getRequestOrigin(req);
  if (!origin) return url;

  return `${origin}${url.startsWith("/") ? url : `/${url}`}`;
}

const usZipCodeSchema = z
  .string()
  .trim()
  .regex(/^\d{5}(?:-\d{4})?$/, "Enter a valid US ZIP code");

const storedImageUrlSchema = z
  .string()
  .min(1)
  .max(2048)
  .refine(
    url =>
      url.startsWith("/local-storage/") || url.startsWith("/manus-storage/"),
    "Image URL must reference project storage"
  );
const storageKeySchema = z
  .string()
  .min(1)
  .max(512)
  .refine(key => !key.includes("..") && !key.includes("\\"), {
    message: "Invalid storage key",
  });
const cornerPointSchema = z.object({
  x: z.number().finite().min(0).max(100),
  y: z.number().finite().min(0).max(100),
});
const additionalCostItemSchema = z.object({
  label: z.string().trim().min(1).max(80),
  amount: z.number().finite().min(0).max(1_000_000),
});
const uploadPhotoInputSchema = z.object({
  photoBase64: z.string(),
  photoName: z.string().min(1).max(160),
  photoMimeType: z.string().refine(isSupportedPhotoMimeType, {
    message: "Unsupported image type",
  }),
  imageWidth: z.number().int().positive().max(20_000),
  imageHeight: z.number().int().positive().max(20_000),
});
const optionalCoordinateSchema = z
  .string()
  .trim()
  .max(32)
  .regex(/^-?\d{1,3}(?:\.\d{1,15})?$/)
  .optional();
const shareTokenSchema = z
  .string()
  .min(16)
  .max(64)
  .regex(/^[A-Za-z0-9_-]+$/);
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

function formatUsd(value: number) {
  return currencyFormatter.format(value);
}

function parseCurrencyAmount(value: string) {
  const parsed = Number.parseFloat(value.replace(/[^0-9.-]+/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseAdditionalCosts(additionalCostsJson: string | null | undefined) {
  if (!additionalCostsJson) return [];

  try {
    const parsed = JSON.parse(additionalCostsJson) as unknown;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .map(item => additionalCostItemSchema.safeParse(item))
      .filter(result => result.success)
      .map(result => result.data);
  } catch {
    return [];
  }
}

function safePdfSlug(value: string | null | undefined) {
  const slug = (value || "driveway-estimate")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return slug || "driveway-estimate";
}

function getBaseUrl(req: Request) {
  const envBaseUrl = process.env.VITE_FRONTEND_FORGE_API_URL?.trim();
  if (envBaseUrl) return envBaseUrl.replace(/\/+$/, "");

  return getRequestOrigin(req) || "http://localhost:3000";
}

function buildMaterialPreviewPrompt(
  material: (typeof MATERIALS)[number],
  editPrompt?: string
) {
  const materialNames: Record<(typeof MATERIALS)[number], string> = {
    hotmix: "hot mix asphalt",
    millings: "asphalt millings",
    tar_and_chip: "tar and chip",
    gravel: "gravel",
  };

  const normalizedEditPrompt = editPrompt?.trim().replace(/\s+/g, " ");
  const promptSections = [
    "You are editing a real driveway photo for a contractor estimate.",
    `Apply ${materialNames[material]} to the driveway surface only.`,
    "Keep the same camera angle, home, lighting, shadows, lawn, and surroundings.",
    "Make the result photorealistic and construction-ready.",
  ];

  if (normalizedEditPrompt) {
    promptSections.push(
      `Additional user instructions: ${normalizedEditPrompt}.`
    );
  }

  promptSections.push(
    "If any user instruction conflicts with preserving the original scene, preserve the original scene and only alter the driveway surface."
  );

  return promptSections.join(" ");
}

/**
 * Upload photo and detect driveway edges for project creation.
 * 
 * IMPORTANT: This function stores photos to the database/storage system.
 * - Photos are stored using storagePut() and assigned a photoUrl and photoKey
 * - These stored photos become part of the project record in the database
 * - Only photos uploaded through this function are stored as project photos
 * 
 * This ensures that all project photos are properly stored and retrievable,
 * while the LiveView component remains for preview purposes only.
 */
async function uploadPhotoAndDetectEdgesForOwner(
  req: Request,
  ownerKey: string,
  input: z.infer<typeof uploadPhotoInputSchema>
) {
  const photoMimeType = input.photoMimeType;
  if (!isSupportedPhotoMimeType(photoMimeType)) {
    throw new Error("Unsupported image type");
  }

  const buffer = decodePhotoBase64(input.photoBase64, photoMimeType);
  const storedPhotoName = buildStoredPhotoName(input.photoName, photoMimeType);
  const requestedPhotoKey = `projects/${ownerKey}/${nanoid()}-${storedPhotoName}`;
  const { key: photoKey, url: photoUrl } = await storagePut(
    requestedPhotoKey,
    buffer,
    photoMimeType
  );

  let edgeDetection: {
    corners: Array<{ x: number; y: number }>;
    confidence: number;
    description: string;
  };
  try {
    edgeDetection = await detectDrivewayEdges(toAbsoluteUrl(req, photoUrl));
  } catch {
    edgeDetection = {
      corners: [
        { x: 15, y: 15 },
        { x: 85, y: 15 },
        { x: 85, y: 85 },
        { x: 15, y: 85 },
      ],
      confidence: 0.5,
      description: "Estimated driveway boundary (AI edge detection unavailable)",
    };
  }
  const squareFeet = calculateSquareFeetFromCorners(
    edgeDetection.corners,
    input.imageWidth,
    input.imageHeight
  );

  return {
    photoUrl,
    photoKey,
    corners: edgeDetection.corners,
    confidence: edgeDetection.confidence,
    description: edgeDetection.description,
    squareFeet,
  };
}

function toSharedProject(project: Project) {
  return {
    projectName: project.projectName,
    photoUrl: project.photoUrl,
    squareFeet: project.squareFeet,
    depthInches: project.depthInches,
    selectedMaterial: project.selectedMaterial,
    quantityNeeded: project.quantityNeeded,
    pricePerUnit: project.pricePerUnit,
    materialCost: project.materialCost,
    contractorPricePerSquareFoot: project.contractorPricePerSquareFoot,
    laborCost: project.laborCost,
    totalCost: project.totalCost,
    additionalCosts: parseAdditionalCosts(project.additionalCostsJson),
    finalInvoiceTotal: project.finalInvoiceTotal,
    acceptedAt: project.acceptedAt,
    zipCode: project.zipCode,
    previewImageUrl: project.previewImageUrl,
    notes: project.notes,
    createdAt: project.createdAt,
  };
}

async function getProjectForShareToken(shareToken: string) {
  const share = await getProjectShareByToken(shareToken);
  if (!share) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Share not found" });
  }

  if (share.expiresAt && new Date(share.expiresAt).getTime() <= Date.now()) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Share not found" });
  }

  const project = await getProjectById(share.projectId);
  if (!project) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Project not found",
    });
  }

  return project;
}

export const projectsRouter = router({
  /**
   * List all projects for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const currentUser = ctx.user!;
    const projects = await getUserProjects(currentUser.id);
    return projects.map(p => ({
      ...p,
      cornerPoints: p.cornerPoints ? JSON.parse(p.cornerPoints) : null,
      additionalCosts: parseAdditionalCosts(p.additionalCostsJson),
    }));
  }),

  /**
   * Get a single project by ID
   */
  getById: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const currentUser = ctx.user!;
      const project = await getProjectById(input.projectId);
      if (!project || project.userId !== currentUser.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }
      return {
        ...project,
        cornerPoints: project.cornerPoints
          ? JSON.parse(project.cornerPoints)
          : null,
        additionalCosts: parseAdditionalCosts(project.additionalCostsJson),
      };
    }),

  /**
   * Upload photo and detect driveway edges
   */
  uploadPhotoAndDetectEdges: protectedProcedure
    .input(uploadPhotoInputSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = ctx.user!;
        return await uploadPhotoAndDetectEdgesForOwner(
          ctx.req,
          String(currentUser.id),
          input
        );
      } catch (error) {
        console.error("[Projects] Edge detection error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to detect driveway edges",
        });
      }
    }),

  /**
   * Reverse geocode GPS coordinates to ZIP code + city + state.
   * Used by the client to auto-fill the pricing ZIP field after GPS capture.
   */
  reverseGeocode: publicProcedure
    .input(
      z.object({
        latitude: z.number().finite().min(-90).max(90),
        longitude: z.number().finite().min(-180).max(180),
      })
    )
    .query(async ({ input }) => {
      return reverseGeocodeToZip(input.latitude, input.longitude);
    }),

  /**
   * Get pricing for a material in a specific location
   */
  getPricing: protectedProcedure
    .input(
      z.object({
        zipCode: usZipCodeSchema,
        material: z.enum(MATERIALS),
        squareFeet: z.number().finite().positive().max(1_000_000),
        depthInches: z.number().finite().min(1).max(12),
      })
    )
    .query(async ({ input }) => {
      try {
        const pricing = await getMaterialPricingForZip(
          input.zipCode,
          input.material
        );
        const quantity = calculateMaterialQuantity(
          input.squareFeet,
          input.depthInches,
          input.material
        );
        const materialCost = calculateTotalCost(
          quantity.quantity,
          pricing.pricePerTon
        );

        return {
          pricePerTon: pricing.pricePerTon,
          pricePerSquareFoot: pricing.pricePerSquareFoot,
          supplier: pricing.supplier,
          quantityNeeded: quantity.quantityStr,
          materialCost,
        };
      } catch (error) {
        console.error("[Projects] Pricing error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to get pricing",
        });
      }
    }),

  /**
   * Generate material preview image
   */
  generateMaterialPreview: protectedProcedure
    .input(
      z.object({
        photoUrl: storedImageUrlSchema,
        photoMimeType: z.string().refine(isSupportedPhotoMimeType, {
          message: "Unsupported image type",
        }),
        material: z.enum(MATERIALS),
        editPrompt: z.string().trim().min(1).max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const prompt = buildMaterialPreviewPrompt(
          input.material,
          input.editPrompt
        );

        const {
          url: previewUrl,
          key: previewKey,
          usedFallback,
        } = await generateImage({
          prompt,
          originalImages: [
            {
              url: toAbsoluteUrl(ctx.req, input.photoUrl),
              mimeType: input.photoMimeType,
            },
          ],
        });
        if (!previewUrl) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate preview image",
          });
        }

        return {
          previewUrl: usedFallback ? input.photoUrl : previewUrl,
          previewKey: previewKey ?? null,
          usedFallback: usedFallback ?? false,
        };
      } catch (error) {
        console.error("[Projects] Preview generation error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate material preview: ${error instanceof Error ? error.message : "Unknown error"}`,
        });
      }
    }),

  /**
   * Create a new project.
   * 
   * IMPORTANT: This mutation stores project photos in the database.
   * - photoUrl and photoKey are stored in the projects table for the main photo
   * - previewImageUrl and previewImageKey are stored for AI-generated material previews
   * - All project photos are persisted and retrievable via the database
   * 
   * This ensures that all actual project photos (not LiveView previews) are properly stored.
   */
  create: protectedProcedure
    .input(
      z.object({
        projectName: z.string().trim().min(1).max(120),
        photoUrl: storedImageUrlSchema,
        photoKey: storageKeySchema,
        squareFeet: z.number().finite().int().positive().max(1_000_000),
        depthInches: z.number().finite().int().min(1).max(12),
        cornerPoints: z.array(cornerPointSchema).min(3).max(8),
        selectedMaterial: z.enum(MATERIALS),
        zipCode: usZipCodeSchema,
        latitude: optionalCoordinateSchema,
        longitude: optionalCoordinateSchema,
        previewImageUrl: storedImageUrlSchema.optional(),
        previewImageKey: storageKeySchema.optional(),
        contractorEmail: z.string().trim().email().max(320).optional(),
        contractorPricePerSquareFoot: z
          .number()
          .finite()
          .min(0)
          .max(1_000)
          .optional(),
        notes: z.string().trim().max(2_000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const currentUser = ctx.user!;
        const pricing = await getMaterialPricingForZip(
          input.zipCode,
          input.selectedMaterial
        );
        const quantity = calculateMaterialQuantity(
          input.squareFeet,
          input.depthInches,
          input.selectedMaterial
        );
        const materialCost = calculateTotalCost(
          quantity.quantity,
          pricing.pricePerTon
        );
        const contractorRate =
          input.contractorPricePerSquareFoot &&
          input.contractorPricePerSquareFoot > 0
            ? input.contractorPricePerSquareFoot
            : undefined;
        const laborCostValue = contractorRate
          ? contractorRate * input.squareFeet
          : null;
        const laborCost =
          laborCostValue !== null ? formatUsd(laborCostValue) : null;
        const totalCost = formatUsd(
          parseCurrencyAmount(materialCost) + (laborCostValue ?? 0)
        );
        const normalizedZipCode = normalizeZipCode(input.zipCode);
        const project = await createProject({
          userId: currentUser.id,
          projectName: input.projectName,
          photoUrl: input.photoUrl,
          photoKey: input.photoKey,
          squareFeet: input.squareFeet,
          depthInches: input.depthInches,
          cornerPoints: JSON.stringify(input.cornerPoints),
          selectedMaterial: input.selectedMaterial,
          quantityNeeded: quantity.quantityStr,
          pricePerUnit: `$${pricing.pricePerTon.toFixed(2)}`,
          materialCost,
          contractorPricePerSquareFoot: contractorRate
            ? `$${contractorRate.toFixed(2)}`
            : null,
          laborCost,
          totalCost,
          zipCode: normalizedZipCode,
          latitude: input.latitude,
          longitude: input.longitude,
          previewImageUrl: input.previewImageUrl,
          previewImageKey: input.previewImageKey,
          contractorEmail: input.contractorEmail,
          additionalCostsJson: null,
          finalInvoiceTotal: null,
          acceptedAt: null,
          notes: input.notes,
        });

        const projectId = project.id;
        let shareToken: string | undefined;
        let shareLink: string | undefined;

        if (projectId) {
          shareToken = nanoid(32);
          shareLink = `${getBaseUrl(ctx.req)}/share/${shareToken}`;
          await createProjectShare({
            projectId,
            shareToken,
            contractorEmail: input.contractorEmail,
          });
        } else if (currentUser.email || input.contractorEmail) {
          console.warn(
            "[Projects] Created project without returned id; notification share link skipped"
          );
        }

        if (currentUser.email && shareLink) {
          await sendEstimateNotification(
            currentUser.email,
            input.projectName,
            input.squareFeet,
            input.selectedMaterial,
            totalCost,
            shareLink
          );
        }

        if (input.contractorEmail && shareLink) {
          await sendContractorNotification(
            input.contractorEmail,
            currentUser.name || "A homeowner",
            input.projectName,
            input.squareFeet,
            input.selectedMaterial,
            totalCost,
            shareLink
          );
        }

        return {
          projectId,
          shareToken,
          shareLink,
          quantityNeeded: quantity.quantityStr,
          pricePerUnit: `$${pricing.pricePerTon.toFixed(2)}`,
          materialCost,
          contractorPricePerSquareFoot: contractorRate
            ? `$${contractorRate.toFixed(2)}`
            : null,
          laborCost,
          totalCost,
        };
      } catch (error) {
        console.error("[Projects] Create error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create project",
        });
      }
    }),

  finalizeInvoice: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int().positive(),
        additionalCosts: z.array(additionalCostItemSchema).max(12),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user!;
      const project = await getProjectById(input.projectId);

      if (!project || project.userId !== currentUser.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const additionalCosts = input.additionalCosts.map(item => ({
        label: item.label.trim(),
        amount: Number(item.amount.toFixed(2)),
      }));
      const additionalCostsTotalValue = additionalCosts.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      const baseEstimateTotal = parseCurrencyAmount(
        project.totalCost || "$0.00"
      );
      const finalInvoiceTotal = formatUsd(
        baseEstimateTotal + additionalCostsTotalValue
      );

      await updateProject(project.id, {
        additionalCostsJson: JSON.stringify(additionalCosts),
        finalInvoiceTotal,
        acceptedAt: new Date(),
      });

      return {
        additionalCosts,
        additionalCostsTotal: formatUsd(additionalCostsTotalValue),
        finalInvoiceTotal,
      };
    }),

  /**
   * Update an existing project
   */
  update: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int().positive(),
        updates: z.object({
          projectName: z.string().trim().min(1).max(120).optional(),
          notes: z.string().trim().max(2_000).optional(),
          contractorEmail: z.string().trim().email().max(320).optional(),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user!;
      const project = await getProjectById(input.projectId);
      if (!project || project.userId !== currentUser.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      await updateProject(input.projectId, input.updates);
      return { success: true };
    }),

  /**
   * Delete a project
   */
  delete: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user!;
      const project = await getProjectById(input.projectId);
      if (!project || project.userId !== currentUser.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      await deleteProject(input.projectId);
      return { success: true };
    }),

  /**
   * Create a shareable link for a project
   */
  createShareLink: protectedProcedure
    .input(
      z.object({
        projectId: z.number().int().positive(),
        contractorEmail: z.string().trim().email().max(320).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = ctx.user!;
      const project = await getProjectById(input.projectId);
      if (!project || project.userId !== currentUser.id) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }

      const shareToken = nanoid(32);
      const shareLink = `${getBaseUrl(ctx.req)}/share/${shareToken}`;

      await createProjectShare({
        projectId: input.projectId,
        shareToken,
        contractorEmail: input.contractorEmail,
      });

      // Send email if contractor email provided
      if (input.contractorEmail) {
        await sendContractorNotification(
          input.contractorEmail,
          currentUser.name || "A homeowner",
          project.projectName || "Driveway Project",
          project.squareFeet || 0,
          project.selectedMaterial || "unknown",
          project.totalCost || "$0.00",
          shareLink
        );
      }

      return { shareLink, shareToken };
    }),

  /**
   * Get a shared project by token (public access)
   */
  getSharedProject: publicProcedure
    .input(z.object({ shareToken: shareTokenSchema }))
    .query(async ({ input }) => {
      const project = await getProjectForShareToken(input.shareToken);
      return toSharedProject(project);
    }),

  /**
   * Download a shared project as PDF (public access via token)
   */
  downloadSharedPDF: publicProcedure
    .input(z.object({ shareToken: shareTokenSchema }))
    .mutation(async ({ input }) => {
      const project = await getProjectForShareToken(input.shareToken);
      const { generateProjectPDF } = await import("../services/pdfExport");
      const pdfBuffer = await generateProjectPDF(project);
      const base64PDF = pdfBuffer.toString("base64");

      return {
        pdfBase64: base64PDF,
        filename: `driveway-estimate-${safePdfSlug(project.projectName)}-${Date.now()}.pdf`,
      };
    }),

  /**
   * Download project as PDF
   */
  downloadPDF: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .mutation(async ({ input, ctx }) => {
      const currentUser = ctx.user!;
      const project = await getProjectById(input.projectId);
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }
      if (project.userId !== currentUser.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const { generateProjectPDF } = await import("../services/pdfExport");
      const pdfBuffer = await generateProjectPDF(project);
      const base64PDF = pdfBuffer.toString("base64");

      return {
        pdfBase64: base64PDF,
        filename: `driveway-estimate-${safePdfSlug(project.projectName)}-${Date.now()}.pdf`,
      };
    }),

  /**
   * Public: generate a material preview image for the landing page demo.
   * 
   * IMPORTANT: This is for DEMO ONLY and does NOT store photos in the database.
   * - This generates temporary previews for the landing page demonstration
   * - No photos are stored in the database from this function
   * - Only the actual project creation (create mutation) stores photos
   */
  generateLandingPreview: publicProcedure
    .input(
      z.object({
        material: z.enum(MATERIALS),
        photoUrl: z.string().url().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const photoUrl =
        input.photoUrl || "https://placehold.co/800x600/1a1a2e/eee?text=Driveway";
      const prompt = buildMaterialPreviewPrompt(input.material);
      const result = await generateImage({
        prompt,
        originalImages: [{ url: photoUrl, mimeType: "image/jpeg" }],
      });
      return { previewUrl: result.url, usedFallback: result.usedFallback ?? false };
    }),

  /**
   * Public: get pricing for the landing page demo
   */
  getLandingPricing: publicProcedure
    .input(
      z.object({
        material: z.enum(MATERIALS),
        zipCode: z.string().regex(/^\d{5}$/).default("10001"),
      })
    )
    .query(async ({ input }) => {
      const pricing = await getMaterialPricingForZip(input.zipCode, input.material);
      const qty = calculateMaterialQuantity(1000, 4, input.material);
      const totalCost = calculateTotalCost(qty.quantity, pricing.pricePerTon);
      return {
        pricePerSquareFoot: pricing.pricePerSquareFoot,
        pricePerTon: pricing.pricePerTon,
        supplier: pricing.supplier,
        quantityNeeded: qty.quantityStr,
        totalCost,
      };
    }),
});
