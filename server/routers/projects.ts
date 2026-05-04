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
import { detectDrivewayEdges, calculateSquareFeetFromCorners } from "../services/edgeDetection";
import { getMaterialPricingForZip, calculateMaterialQuantity, calculateTotalCost } from "../services/pricing";
import { sendEstimateNotification, sendContractorNotification } from "../services/email";
import { generateImage } from "../_core/imageGeneration";

export const projectsRouter = router({
  /**
   * List all projects for the current user
   */
  list: protectedProcedure.query(async ({ ctx }) => {
    const projects = await getUserProjects(ctx.user.id);
    return projects.map((p) => ({
      ...p,
      cornerPoints: p.cornerPoints ? JSON.parse(p.cornerPoints) : null,
    }));
  }),

  /**
   * Get a single project by ID
   */
  getById: protectedProcedure.input(z.object({ projectId: z.number() })).query(async ({ ctx, input }) => {
    const project = await getProjectById(input.projectId);
    if (!project || project.userId !== ctx.user.id) {
      throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
    }
    return {
      ...project,
      cornerPoints: project.cornerPoints ? JSON.parse(project.cornerPoints) : null,
    };
  }),

  /**
   * Upload photo and detect driveway edges
   */
  uploadPhotoAndDetectEdges: protectedProcedure
    .input(
      z.object({
        photoBase64: z.string(),
        photoName: z.string(),
        imageWidth: z.number(),
        imageHeight: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        // Convert base64 to buffer
        const buffer = Buffer.from(input.photoBase64, "base64");

        // Upload to S3
        const photoKey = `projects/${ctx.user.id}/${nanoid()}-${input.photoName}`;
        const { url: photoUrl } = await storagePut(photoKey, buffer, "image/jpeg");

        // Detect driveway edges using LLM vision
        const edgeDetection = await detectDrivewayEdges(photoUrl);

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
        zipCode: z.string(),
        material: z.enum(["hotmix", "millings", "tar_and_chip", "gravel"]),
        squareFeet: z.number(),
        depthInches: z.number(),
      })
    )
    .query(async ({ input }) => {
      try {
        const pricing = await getMaterialPricingForZip(input.zipCode, input.material);
        const quantity = calculateMaterialQuantity(input.squareFeet, input.depthInches, input.material);
        const totalCost = calculateTotalCost(quantity.quantity, pricing.pricePerTon);

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
        const { url: storedPreviewUrl } = await storagePut(previewKey, previewBuffer, "image/jpeg");

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
        selectedMaterial: z.enum(["hotmix", "millings", "tar_and_chip", "gravel"]),
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      const shareToken = nanoid(32);
      const baseUrl = process.env.VITE_FRONTEND_FORGE_API_URL || "http://localhost:3000";
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
        throw new TRPCError({ code: "NOT_FOUND", message: "Project not found" });
      }

      return {
        ...project,
        cornerPoints: project.cornerPoints ? JSON.parse(project.cornerPoints) : null,
      };
    }),
});
