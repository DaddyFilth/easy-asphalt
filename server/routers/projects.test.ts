import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Mock all external I/O so the router runs without DB/LLM/S3 ──────────────
vi.mock("../db", () => ({
  getUserProjects: vi.fn().mockResolvedValue([]),
  getProjectById: vi.fn().mockResolvedValue(null),
  createProject: vi.fn().mockResolvedValue({ id: 1 }),
  updateProject: vi.fn().mockResolvedValue(undefined),
  deleteProject: vi.fn().mockResolvedValue(undefined),
  createProjectShare: vi.fn().mockResolvedValue(undefined),
  getProjectShareByToken: vi.fn().mockResolvedValue(null),
  getMaterialPrices: vi.fn().mockResolvedValue(null),
  upsertMaterialPrice: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("../storage", () => ({
  storagePut: vi.fn().mockResolvedValue({ url: "https://s3.example.com/photo.jpg" }),
}));

vi.mock("../_core/llm", () => ({
  invokeLLM: vi.fn().mockResolvedValue({
    choices: [{
      message: {
        content: JSON.stringify({
          corners: [
            { x: 10, y: 10 }, { x: 90, y: 10 },
            { x: 90, y: 90 }, { x: 10, y: 90 },
          ],
          confidence: 0.92,
          description: "Rectangular driveway detected",
        }),
      },
    }],
  }),
}));

vi.mock("../_core/imageGeneration", () => ({
  generateImage: vi.fn().mockResolvedValue({ url: "https://s3.example.com/preview.jpg" }),
}));

vi.mock("../services/email", () => ({
  sendEstimateNotification: vi.fn().mockResolvedValue(undefined),
  sendContractorNotification: vi.fn().mockResolvedValue(undefined),
}));

import {
  getMaterialPricingForZip,
  calculateMaterialQuantity,
  calculateTotalCost,
} from "../services/pricing";
import {
  detectDrivewayEdges,
  calculateSquareFeetFromCorners,
} from "../services/edgeDetection";

// ── Unit tests for the service functions called inside the router ───────────
describe("Router — service integration (unit)", () => {
  describe("pricing pipeline", () => {
    it("returns correct total for hotmix default zip", async () => {
      const pricing = await getMaterialPricingForZip("99999", "hotmix");
      expect(pricing.pricePerTon).toBe(75);
      const qty = calculateMaterialQuantity(640, 2, "hotmix");
      expect(qty.quantity).toBeGreaterThan(0);
      const total = calculateTotalCost(qty.quantity, pricing.pricePerTon);
      expect(total).toMatch(/^\$\d+\.\d{2}$/);
    });

    it("returns numeric pricePerTon and pricePerSquareFoot", async () => {
      const pricing = await getMaterialPricingForZip("10001", "millings");
      expect(typeof pricing.pricePerTon).toBe("number");
      expect(typeof pricing.pricePerSquareFoot).toBe("number");
      expect(pricing.supplier).toBeTruthy();
    });

    it("all four materials resolve without error", async () => {
      const materials = ["hotmix", "millings", "tar_and_chip", "gravel"] as const;
      for (const m of materials) {
        await expect(getMaterialPricingForZip("90210", m)).resolves.not.toThrow();
      }
    });
  });

  describe("edge detection pipeline", () => {
    it("detectDrivewayEdges returns shaped result from mocked LLM", async () => {
      const result = await detectDrivewayEdges("https://example.com/photo.jpg");
      expect(result.corners).toHaveLength(4);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.description).toBeTruthy();
      result.corners.forEach(c => {
        expect(c.x).toBeGreaterThanOrEqual(0);
        expect(c.y).toBeGreaterThanOrEqual(0);
      });
    });

    it("square footage is calculated from detected corners", async () => {
      const { corners } = await detectDrivewayEdges("https://example.com/photo.jpg");
      const sqft = calculateSquareFeetFromCorners(corners, 1000, 1000, 10);
      expect(sqft).toBeGreaterThanOrEqual(100);
    });
  });
});

// ── Full getPricing output shape ─────────────────────────────────────────────
describe("getPricing output shape", () => {
  it("totalCost is a formatted currency string", async () => {
    const pricing = await getMaterialPricingForZip("75022", "gravel");
    const qty = calculateMaterialQuantity(500, 3, "gravel");
    const total = calculateTotalCost(qty.quantity, pricing.pricePerTon);
    expect(total).toMatch(/^\$[0-9]+\.[0-9]{2}$/);
  });

  it("quantityStr matches expected format", () => {
    const { quantityStr } = calculateMaterialQuantity(800, 2, "tar_and_chip");
    expect(quantityStr).toMatch(/^\d+\.\d{2} tons$/);
  });
});
