import { getMaterialPrices, upsertMaterialPrice } from "../db";
import { InsertMaterialPrice } from "../../drizzle/schema";

const MATERIALS = ["hotmix", "millings", "tar_and_chip", "gravel"] as const;
type Material = (typeof MATERIALS)[number];

/** Cache TTL: 24 hours */
const CACHE_TTL_HOURS = 24;

/**
 * Mock pricing data — replace with real supplier API calls in production.
 * Prices are stored as plain numbers (USD); formatting happens at the call site.
 */
const mockPricingByZip: Record<
  string,
  Record<Material, { pricePerTon: number; pricePerSqFt: number }>
> = {
  "10001": {
    hotmix:       { pricePerTon: 85, pricePerSqFt: 2.50 },
    millings:     { pricePerTon: 35, pricePerSqFt: 1.00 },
    tar_and_chip: { pricePerTon: 45, pricePerSqFt: 1.30 },
    gravel:       { pricePerTon: 25, pricePerSqFt: 0.75 },
  },
  "90210": {
    hotmix:       { pricePerTon: 95, pricePerSqFt: 2.80 },
    millings:     { pricePerTon: 40, pricePerSqFt: 1.20 },
    tar_and_chip: { pricePerTon: 50, pricePerSqFt: 1.50 },
    gravel:       { pricePerTon: 30, pricePerSqFt: 0.90 },
  },
  default: {
    hotmix:       { pricePerTon: 75, pricePerSqFt: 2.20 },
    millings:     { pricePerTon: 30, pricePerSqFt: 0.90 },
    tar_and_chip: { pricePerTon: 40, pricePerSqFt: 1.20 },
    gravel:       { pricePerTon: 20, pricePerSqFt: 0.60 },
  },
};

/**
 * Get material pricing for a specific ZIP code.
 * Checks DB cache first; falls back to mock data and writes cache with correct expiresAt.
 * Returns prices as plain numbers — callers format as currency.
 */
export async function getMaterialPricingForZip(
  zipCode: string,
  material: Material
): Promise<{
  pricePerTon: number;
  pricePerSquareFoot: number;
  supplier: string;
}> {
  // --- Cache read ---
  const cached = await getMaterialPrices(zipCode, material);
  if (cached?.expiresAt && new Date(cached.expiresAt) > new Date()) {
    return {
      pricePerTon:       parseFloat(cached.pricePerTon),
      pricePerSquareFoot: parseFloat(cached.pricePerSquareFoot),
      supplier:          cached.supplier ?? "Local Supplier",
    };
  }

  // --- Fetch (mock or real API) ---
  const pricingData = mockPricingByZip[zipCode] ?? mockPricingByZip.default;
  const materialPrice = pricingData[material];
  if (!materialPrice) throw new Error(`Pricing not available for material: ${material}`);

  // --- Cache write: include expiresAt so next read is a cache hit ---
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

  const cacheEntry: InsertMaterialPrice = {
    zipCode,
    material,
    pricePerTon:        materialPrice.pricePerTon.toFixed(2),
    pricePerSquareFoot: materialPrice.pricePerSqFt.toFixed(2),
    supplier:           "Regional Supplier",
    expiresAt,
  };

  try {
    await upsertMaterialPrice(cacheEntry);
  } catch (err) {
    console.warn("[Pricing] Failed to cache pricing:", err);
  }

  return {
    pricePerTon:       materialPrice.pricePerTon,
    pricePerSquareFoot: materialPrice.pricePerSqFt,
    supplier:          "Regional Supplier",
  };
}

/**
 * Calculate material quantity needed for a project.
 * Returns quantity in tons (standard unit for driveway materials).
 */
export function calculateMaterialQuantity(
  squareFeet: number,
  depthInches: number,
  material: Material
): { quantity: number; unit: string; quantityStr: string } {
  const depthFeet   = depthInches / 12;
  const cubicFeet   = squareFeet * depthFeet;
  const cubicYards  = cubicFeet / 27;

  const densityPerCubicYard: Record<Material, number> = {
    hotmix:       1.5,
    millings:     1.3,
    tar_and_chip: 1.2,
    gravel:       1.0,
  };

  const tons = cubicYards * (densityPerCubicYard[material] ?? 1.2);
  const rounded = Math.round(tons * 100) / 100;

  return {
    quantity:    rounded,
    unit:        "tons",
    quantityStr: `${rounded.toFixed(2)} tons`,
  };
}

/**
 * Calculate total cost for a project.
 * Accepts pricePerTon as a plain number — no string parsing needed.
 */
export function calculateTotalCost(
  quantity: number,
  pricePerTon: number
): string {
  return `$${(quantity * pricePerTon).toFixed(2)}`;
}
