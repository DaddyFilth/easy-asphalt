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

function toSharedProject(project: Project) {
  return {
    projectName: project.projectName,
    photoUrl: project.photoUrl,
    squareFeet: project.squareFeet,
    depthInches: project.depthInches,
    selectedMaterial: project.selectedMaterial,
    quantityNeeded: project.quantityNeeded,
    pricePerUnit: project.pricePerUnit,
    totalCost: project.totalCost,
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
    const projects = await getUserProjects(ctx.user.id);
    return projects.map(p => ({
      ...p,
      cornerPoints: p.cornerPoints ? JSON.parse(p.cornerPoints) : null,
    }));
  }),

  /**
   * Get a single project by ID
   */
  getById: protectedProcedure
    .input(z.object({ projectId: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const project = await getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
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
      };
    }),

  /**
   * Upload photo and detect driveway edges
   */
  uploadPhotoAndDetectEdges: protectedProcedure
    .input(
      z.object({
        photoBase64: z.string(),
        photoName: z.string().min(1).max(160),
        photoMimeType: z.string().refine(isSupportedPhotoMimeType, {
          message: "Unsupported image type",
        }),
        imageWidth: z.number().int().positive().max(20_000),
        imageHeight: z.number().int().positive().max(20_000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const photoMimeType = input.photoMimeType;
        if (!isSupportedPhotoMimeType(photoMimeType)) {
          throw new Error("Unsupported image type");
        }

        const buffer = decodePhotoBase64(input.photoBase64, photoMimeType);
        const storedPhotoName = buildStoredPhotoName(
          input.photoName,
          photoMimeType
        );

        // Upload to S3
        const requestedPhotoKey = `projects/${ctx.user.id}/${nanoid()}-${storedPhotoName}`;
        const { key: photoKey, url: photoUrl } = await storagePut(
          requestedPhotoKey,
          buffer,
          photoMimeType
        );

        // Detect driveway edges using LLM vision
        const edgeDetection = await detectDrivewayEdges(
          toAbsoluteUrl(ctx.req, photoUrl)
        );

        // Calculate square footage from detected corners
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
      } catch (error) {
        console.error("[Projects] Edge detection error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to detect driveway edges",
        });
      }
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
        const totalCost = calculateTotalCost(
          quantity.quantity,
          pricing.pricePerTon
        );

        return {
          pricePerTon: pricing.pricePerTon,
          pricePerSquareFoot: pricing.pricePerSquareFoot,
          supplier: pricing.supplier,
          quantityNeeded: quantity.quantityStr,
          totalCost,
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
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const materialNames: Record<string, string> = {
          hotmix: "hot mix asphalt",
          millings: "asphalt millings",
          tar_and_chip: "tar and chip",
          gravel: "gravel",
        };

        const prompt = `Take this driveway photo and generate a photorealistic preview showing what it would look like with ${materialNames[input.material]} applied. Keep the same perspective, lighting, and surroundings. Only modify the driveway surface itself.`;

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
   * Create a new project
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
        notes: z.string().trim().max(2_000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const pricing = await getMaterialPricingForZip(
          input.zipCode,
          input.selectedMaterial
        );
        const quantity = calculateMaterialQuantity(
          input.squareFeet,
          input.depthInches,
          input.selectedMaterial
        );
        const totalCost = calculateTotalCost(
          quantity.quantity,
          pricing.pricePerTon
        );
        const normalizedZipCode = normalizeZipCode(input.zipCode);
        const project = await createProject({
          userId: ctx.user.id,
          projectName: input.projectName,
          photoUrl: input.photoUrl,
          photoKey: input.photoKey,
          squareFeet: input.squareFeet,
          depthInches: input.depthInches,
          cornerPoints: JSON.stringify(input.cornerPoints),
          selectedMaterial: input.selectedMaterial,
          quantityNeeded: quantity.quantityStr,
          pricePerUnit: `$${pricing.pricePerTon.toFixed(2)}`,
          totalCost,
          zipCode: normalizedZipCode,
          latitude: input.latitude,
          longitude: input.longitude,
          previewImageUrl: input.previewImageUrl,
          previewImageKey: input.previewImageKey,
          contractorEmail: input.contractorEmail,
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
        } else if (ctx.user.email || input.contractorEmail) {
          console.warn(
            "[Projects] Created project without returned id; notification share link skipped"
          );
        }

        if (ctx.user.email && shareLink) {
          await sendEstimateNotification(
            ctx.user.email,
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
            ctx.user.name || "A homeowner",
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
      const project = await getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
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
      const project = await getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
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
      const project = await getProjectById(input.projectId);
      if (!project || project.userId !== ctx.user.id) {
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
          ctx.user.name || "A homeowner",
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
      const project = await getProjectById(input.projectId);
      if (!project) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Project not found",
        });
      }
      if (project.userId !== ctx.user.id) {
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
});
