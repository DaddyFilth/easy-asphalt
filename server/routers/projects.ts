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
    .input(z.object({ projectId: z.number() }))
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
        photoUrl: z.string(),
        material: z.enum(["hotmix", "millings", "tar_and_chip", "gravel"]),
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

        const { url: previewUrl } = await generateImage({
          prompt,
          originalImages: [
            {
              url: input.photoUrl,
              mimeType: "image/jpeg",
            },
          ],
        });

        // Upload preview to S3
        const previewKey = `previews/${ctx.user.id}/${nanoid()}-preview.jpg`;
        if (!previewUrl) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate preview image",
          });
        }

        const response = await fetch(previewUrl);
        const arrayBuffer = await response.arrayBuffer();
        const previewBuffer = Buffer.from(arrayBuffer);
        const { url: storedPreviewUrl } = await storagePut(
          previewKey,
          previewBuffer,
          "image/jpeg"
        );

        return {
          previewUrl: storedPreviewUrl,
          previewKey,
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
        projectName: z.string(),
        photoUrl: z.string(),
        photoKey: z.string(),
        squareFeet: z.number(),
        depthInches: z.number(),
        cornerPoints: z.array(z.object({ x: z.number(), y: z.number() })),
        selectedMaterial: z.enum([
          "hotmix",
          "millings",
          "tar_and_chip",
          "gravel",
        ]),
        quantityNeeded: z.string(),
        pricePerUnit: z.string(),
        totalCost: z.string(),
        zipCode: z.string(),
        latitude: z.string().optional(),
        longitude: z.string().optional(),
        previewImageUrl: z.string().optional(),
        previewImageKey: z.string().optional(),
        contractorEmail: z.string().email().optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await createProject({
          userId: ctx.user.id,
          projectName: input.projectName,
          photoUrl: input.photoUrl,
          photoKey: input.photoKey,
          squareFeet: input.squareFeet,
          depthInches: input.depthInches,
          cornerPoints: JSON.stringify(input.cornerPoints),
          selectedMaterial: input.selectedMaterial,
          quantityNeeded: input.quantityNeeded,
          pricePerUnit: input.pricePerUnit,
          totalCost: input.totalCost,
          zipCode: input.zipCode,
          latitude: input.latitude,
          longitude: input.longitude,
          previewImageUrl: input.previewImageUrl,
          previewImageKey: input.previewImageKey,
          contractorEmail: input.contractorEmail,
          notes: input.notes,
        });

        // Send notification email to owner
        if (ctx.user.email) {
          const shareToken = nanoid(32);
          const shareLink = `${process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000"}/share/${shareToken}`;

          await sendEstimateNotification(
            ctx.user.email,
            input.projectName,
            input.squareFeet,
            input.selectedMaterial,
            input.totalCost,
            shareLink
          );

          // Send notification to contractor if provided
          if (input.contractorEmail) {
            await sendContractorNotification(
              input.contractorEmail,
              ctx.user.name || "A homeowner",
              input.projectName,
              input.squareFeet,
              input.selectedMaterial,
              input.totalCost,
              shareLink
            );
          }
        }

        return result;
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
        projectId: z.number(),
        updates: z.object({
          projectName: z.string().optional(),
          notes: z.string().optional(),
          contractorEmail: z.string().email().optional(),
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
    .input(z.object({ projectId: z.number() }))
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
        projectId: z.number(),
        contractorEmail: z.string().email().optional(),
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
      const baseUrl =
        process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000";
      const shareLink = `${baseUrl}/share/${shareToken}`;

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
    .input(z.object({ shareToken: z.string() }))
    .query(async ({ input }) => {
      const share = await getProjectShareByToken(input.shareToken);
      if (!share) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Share not found" });
      }

      const project = await getProjectById(share.projectId);
      if (!project) {
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
   * Download project as PDF
   */
  downloadPDF: protectedProcedure
    .input(z.object({ projectId: z.number() }))
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
        filename: `driveway-estimate-${project.projectName?.replace(/\s+/g, "-")}-${Date.now()}.pdf`,
      };
    }),
});
