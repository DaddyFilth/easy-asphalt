import { getMaterialPrices, upsertMaterialPrice } from "../db";
import { InsertMaterialPrice } from "../../drizzle/schema";

const MATERIALS = ["hotmix", "millings", "tar_and_chip", "gravel"] as const;
type Material = (typeof MATERIALS)[number];

/**
 * Mock pricing data - in production, integrate with real supplier APIs
 * This demonstrates the structure; replace with actual API calls to suppliers
 */
const mockPricingByZip: Record<string, Record<Material, { pricePerTon: number; pricePerSqFt: number }>> = {
  "10001": {
    hotmix: { pricePerTon: 85, pricePerSqFt: 2.5 },
    millings: { pricePerTon: 35, pricePerSqFt: 1.0 },
    tar_and_chip: { pricePerTon: 45, pricePerSqFt: 1.3 },
    gravel: { pricePerTon: 25, pricePerSqFt: 0.75 },
  },
  "90210": {
    hotmix: { pricePerTon: 95, pricePerSqFt: 2.8 },
    millings: { pricePerTon: 40, pricePerSqFt: 1.2 },
    tar_and_chip: { pricePerTon: 50, pricePerSqFt: 1.5 },
    gravel: { pricePerTon: 30, pricePerSqFt: 0.9 },
  },
  default: {
    hotmix: { pricePerTon: 75, pricePerSqFt: 2.2 },
    millings: { pricePerTon: 30, pricePerSqFt: 0.9 },
    tar_and_chip: { pricePerTon: 40, pricePerSqFt: 1.2 },
    gravel: { pricePerTon: 20, pricePerSqFt: 0.6 },
  },
};

/**
 * Get material pricing for a specific ZIP code
 * First checks cache, then falls back to mock data
 * In production, this would query real supplier APIs
 */
export async function getMaterialPricingForZip(
  zipCode: string,
  material: Material
): Promise<{
  pricePerTon: string;
  pricePerSquareFoot: string;
  supplier: string | null;
}> {
  // Check cache first
  const cached = await getMaterialPrices(zipCode, material);
  if (cached && cached.expiresAt && new Date(cached.expiresAt) > new Date()) {
    return {
      pricePerTon: cached.pricePerTon,
      pricePerSquareFoot: cached.pricePerSquareFoot,
      supplier: cached.supplier || "Local Supplier",
    };
  }

  // Get pricing data (mock or real API)
  const pricingData = mockPricingByZip[zipCode] || mockPricingByZip.default;
  const materialPrice = pricingData[material];

  if (!materialPrice) {
    throw new Error(`Pricing not available for material: ${material}`);
  }

  // Cache the pricing for 24 hours
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);

  const cacheEntry: InsertMaterialPrice = {
    zipCode,
    material,
    pricePerTon: `$${materialPrice.pricePerTon.toFixed(2)}`,
    pricePerSquareFoot: `$${materialPrice.pricePerSqFt.toFixed(2)}`,
    supplier: "Regional Supplier",
  };

  try {
    await upsertMaterialPrice(cacheEntry);
  } catch (error) {
    console.warn("[Pricing] Failed to cache pricing:", error);
  }

  return {
    pricePerTon: cacheEntry.pricePerTon,
    pricePerSquareFoot: cacheEntry.pricePerSquareFoot,
    supplier: cacheEntry.supplier || "Regional Supplier",
  };
}

/**
 * Calculate material quantity needed based on square footage and depth
 * Returns quantity in tons (standard unit for driveway materials)
 */
export function calculateMaterialQuantity(
  squareFeet: number,
  depthInches: number,
  material: Material
): { quantity: number; unit: string; quantityStr: string } {
  // Convert to cubic yards (standard for driveway materials)
  // 1 cubic yard = 27 cubic feet
  const depthFeet = depthInches / 12;
  const cubicFeet = squareFeet * depthFeet;
  const cubicYards = cubicFeet / 27;

  // Material density varies; convert to tons
  // These are approximate densities in tons per cubic yard
  const densityPerCubicYard: Record<Material, number> = {
    hotmix: 1.5, // Asphalt is denser
    millings: 1.3,
    tar_and_chip: 1.2,
    gravel: 1.0, // Gravel is lighter
  };

  const tons = cubicYards * (densityPerCubicYard[material] || 1.2);

  return {
    quantity: Math.round(tons * 100) / 100, // Round to 2 decimals
    unit: "tons",
    quantityStr: `${(Math.round(tons * 100) / 100).toFixed(2)} tons`,
  };
}

/**
 * Calculate total cost for a project
 */
export function calculateTotalCost(
  quantity: number,
  pricePerTon: string | null | undefined
): string {
  if (!pricePerTon) return "$0.00";
  // Parse price string (e.g., "$45.00" -> 45)
  const price = parseFloat(pricePerTon.replace(/[^0-9.]/g, ""));
  const total = quantity * price;
  return `$${total.toFixed(2)}`;
}
