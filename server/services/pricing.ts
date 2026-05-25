import { getMaterialPrices, upsertMaterialPrice } from "../db";
import { InsertMaterialPrice } from "../../drizzle/schema";

export const MATERIALS = [
  "hotmix",
  "millings",
  "tar_and_chip",
  "gravel",
] as const;
export type Material = (typeof MATERIALS)[number];

const CACHE_TTL_HOURS = 24;
const ZIP_CODE_PATTERN = /^\d{5}(?:-\d{4})?$/;
const MAX_QUOTE_SQUARE_FEET = 1_000_000;
const MIN_DEPTH_INCHES = 1;
const MAX_DEPTH_INCHES = 12;

const defaultPricing: Record<Material, { pricePerTon: number; pricePerSqFt: number }> = {
  hotmix: { pricePerTon: 75, pricePerSqFt: 2.2 },
  millings: { pricePerTon: 30, pricePerSqFt: 0.9 },
  tar_and_chip: { pricePerTon: 40, pricePerSqFt: 1.2 },
  gravel: { pricePerTon: 20, pricePerSqFt: 0.6 },
};

export function normalizeZipCode(zipCode: string): string {
  const trimmed = zipCode.trim();
  if (!ZIP_CODE_PATTERN.test(trimmed)) {
    throw new Error("Invalid ZIP code");
  }
  return trimmed.slice(0, 5);
}

function assertFiniteRange(
  value: number,
  label: string,
  min: number,
  max: number
) {
  if (!Number.isFinite(value) || value < min || value > max) {
    throw new RangeError(`${label} must be between ${min} and ${max}`);
  }
}

interface SupplierPrice {
  pricePerTon: number;
  pricePerSqFt: number;
  supplier: string;
}

async function fetchPricingFromSupplier(
  zipCode: string,
  material: Material
): Promise<SupplierPrice | null> {
  try {
    const regionResponse = await fetch(
      `https://api.zippopotam.us/us/${zipCode}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (regionResponse.ok) {
      const regionData = (await regionResponse.json()) as {
        places?: Array<{ "state": string }>;
      };
      const state = regionData.places?.[0]?.state;
      if (state) {
        const statePricing = getStatePricing(state, material);
        if (statePricing) return statePricing;
      }
    }
  } catch {
    // region lookup failed, use defaults
  }

  return null;
}

function getStatePricing(state: string, material: Material): SupplierPrice | null {
  const regionalMultipliers: Record<string, number> = {
    "CA": 1.15, "NY": 1.20, "NJ": 1.15, "CT": 1.10, "MA": 1.10,
    "FL": 0.95, "TX": 0.90, "AZ": 0.95, "NV": 1.00,
    "IL": 1.05, "OH": 0.95, "PA": 1.00, "MI": 0.95,
    "WA": 1.10, "OR": 1.05, "CO": 1.00, "MN": 0.95,
    "NC": 0.90, "GA": 0.85, "TN": 0.85, "SC": 0.85,
  };

  const base = defaultPricing[material];
  if (!base) return null;

  const multiplier = regionalMultipliers[state] ?? 1.0;
  return {
    pricePerTon: Math.round(base.pricePerTon * multiplier),
    pricePerSqFt: Math.round(base.pricePerSqFt * multiplier * 100) / 100,
    supplier: `Regional Supplier - ${state}`,
  };
}

export async function getMaterialPricingForZip(
  zipCode: string,
  material: Material
): Promise<{
  pricePerTon: number;
  pricePerSquareFoot: number;
  supplier: string;
}> {
  const normalizedZipCode = normalizeZipCode(zipCode);

  const cached = await getMaterialPrices(normalizedZipCode, material);
  if (cached?.expiresAt && new Date(cached.expiresAt) > new Date()) {
    return {
      pricePerTon: parseFloat(cached.pricePerTon),
      pricePerSquareFoot: parseFloat(cached.pricePerSquareFoot),
      supplier: cached.supplier ?? "Local Supplier",
    };
  }

  const supplierPrice = await fetchPricingFromSupplier(normalizedZipCode, material);

  const effectivePrice = supplierPrice ?? defaultPricing[material];
  const supplierName = supplierPrice?.supplier ?? "Local Supplier";

  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

  const cacheEntry: InsertMaterialPrice = {
    zipCode: normalizedZipCode,
    material,
    pricePerTon: effectivePrice.pricePerTon.toFixed(2),
    pricePerSquareFoot: effectivePrice.pricePerSqFt.toFixed(2),
    supplier: supplierName,
    expiresAt,
  };

  try {
    await upsertMaterialPrice(cacheEntry);
  } catch (err) {
    console.warn("[Pricing] Failed to cache pricing:", err);
  }

  return {
    pricePerTon: effectivePrice.pricePerTon,
    pricePerSquareFoot: effectivePrice.pricePerSqFt,
    supplier: supplierName,
  };
}

export function calculateMaterialQuantity(
  squareFeet: number,
  depthInches: number,
  material: Material
): { quantity: number; unit: string; quantityStr: string } {
  assertFiniteRange(squareFeet, "Square feet", 1, MAX_QUOTE_SQUARE_FEET);
  assertFiniteRange(
    depthInches,
    "Depth inches",
    MIN_DEPTH_INCHES,
    MAX_DEPTH_INCHES
  );

  const depthFeet = depthInches / 12;
  const cubicFeet = squareFeet * depthFeet;
  const cubicYards = cubicFeet / 27;

  const densityPerCubicYard: Record<Material, number> = {
    hotmix: 1.5,
    millings: 1.3,
    tar_and_chip: 1.2,
    gravel: 1.0,
  };

  const tons = cubicYards * (densityPerCubicYard[material] ?? 1.2);
  const rounded = Math.round(tons * 100) / 100;

  return {
    quantity: rounded,
    unit: "tons",
    quantityStr: `${rounded.toFixed(2)} tons`,
  };
}

export function calculateTotalCost(
  quantity: number,
  pricePerTon: number
): string {
  assertFiniteRange(quantity, "Quantity", 0, Number.MAX_SAFE_INTEGER);
  assertFiniteRange(pricePerTon, "Price per ton", 0, Number.MAX_SAFE_INTEGER);

  return `$${(quantity * pricePerTon).toFixed(2)}`;
}