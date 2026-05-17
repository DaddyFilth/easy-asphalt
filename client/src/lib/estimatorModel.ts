import type { CSSProperties } from "react";
import type { CornerPoint } from "@shared/geometry";

export type Step = "upload" | "adjust" | "material" | "preview" | "summary";
export type Material = "hotmix" | "millings" | "tar_and_chip" | "gravel";
export type PreviewMode = "static" | "live";
export type LivePreviewStatus =
  | "idle"
  | "starting"
  | "ready"
  | "unsupported"
  | "error";
export type EstimateExitAction = "dashboard" | "material" | "project";
export type AdditionalCostItem = {
  id: string;
  label: string;
  amount: string;
};
export type DeviceReadiness = {
  gpsAccuracyFeet: number | null;
  connectionLabel: string;
  online: boolean;
  bluetoothAvailable: boolean | null;
  pitch: number | null;
  roll: number | null;
};

export interface EstimatorState {
  photoUrl: string | null;
  photoKey: string | null;
  photoMimeType: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  corners: CornerPoint[];
  squareFeet: number | null;
  detectionConfidence: number | null;
  detectionDescription: string;
  depthInches: number;
  selectedMaterial: Material | null;
  previewUrl: string | null;
  previewKey: string | null;
  previewMaterial: Material | null;
  previewPrompt: string;
  previewUsedFallback: boolean;
  projectName: string;
  contractorEmail: string;
  contractorPricePerSquareFoot: string;
  notes: string;
  zipCode: string;
  latitude: string;
  longitude: string;
}

export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export const materialDisplayNames: Record<Material, string> = {
  hotmix: "Hot Mix Asphalt",
  millings: "Asphalt Millings",
  tar_and_chip: "Tar & Chip",
  gravel: "Gravel",
};

export const defaultPreviewPromptByMaterial: Record<Material, string> = {
  hotmix:
    "Fresh black asphalt with a smooth sealed finish and realistic texture.",
  millings:
    "Compacted asphalt millings with a darker recycled texture and clean edges.",
  tar_and_chip:
    "Tar and chip finish with visible aggregate texture and a natural contractor-grade spread.",
  gravel:
    "Fresh gravel surface with balanced stone texture, even coverage, and realistic depth.",
};

export const previewPromptSuggestions = [
  "Keep the driveway darker and freshly finished.",
  "Make the texture more compact and uniform.",
  "Clean up the driveway edges without changing the yard.",
  "Preserve the same lighting and home details.",
];

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

export const formatUsd = (value: number) => usdFormatter.format(value);

export const parseCurrency = (value: string) =>
  Number.parseFloat(value.replace(/[^0-9.-]+/g, ""));

export function createInitialEstimatorState(): EstimatorState {
  return {
    photoUrl: null,
    photoKey: null,
    photoMimeType: null,
    imageWidth: null,
    imageHeight: null,
    corners: [],
    squareFeet: null,
    detectionConfidence: null,
    detectionDescription: "",
    depthInches: 2,
    selectedMaterial: null,
    previewUrl: null,
    previewKey: null,
    previewMaterial: null,
    previewPrompt: "",
    previewUsedFallback: false,
    projectName: "",
    contractorEmail: "",
    contractorPricePerSquareFoot: "",
    notes: "",
    zipCode: "",
    latitude: "",
    longitude: "",
  };
}

export function createAdditionalCostItem(): AdditionalCostItem {
  return {
    id: `cost-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    label: "",
    amount: "",
  };
}

export function buildPolygonClipPath(corners: CornerPoint[]) {
  if (corners.length < 3) {
    return "polygon(0 0, 100% 0, 100% 100%, 0 100%)";
  }

  return `polygon(${corners.map(corner => `${corner.x}% ${corner.y}%`).join(", ")})`;
}

export function getLiveOverlayStyle(material: Material | null): CSSProperties {
  if (material === "millings") {
    return {
      backgroundColor: "rgba(52, 58, 62, 0.76)",
      backgroundImage: [
        "linear-gradient(160deg, rgba(33, 38, 43, 0.94), rgba(82, 88, 92, 0.68))",
        "radial-gradient(circle at 18% 20%, rgba(255,255,255,0.14) 0 1px, transparent 1.6px)",
        "radial-gradient(circle at 68% 62%, rgba(0,0,0,0.34) 0 2px, transparent 2.7px)",
      ].join(", "),
      backgroundSize: "cover, 18px 18px, 26px 26px",
      backgroundBlendMode: "normal, screen, multiply",
    };
  }

  if (material === "tar_and_chip") {
    return {
      backgroundColor: "rgba(72, 76, 69, 0.72)",
      backgroundImage: [
        "linear-gradient(155deg, rgba(48, 49, 40, 0.92), rgba(120, 120, 102, 0.55))",
        "radial-gradient(circle at 22% 30%, rgba(228, 218, 190, 0.46) 0 2px, transparent 2.8px)",
        "radial-gradient(circle at 70% 68%, rgba(51, 46, 36, 0.36) 0 2.4px, transparent 3px)",
      ].join(", "),
      backgroundSize: "cover, 22px 22px, 28px 28px",
      backgroundBlendMode: "normal, screen, multiply",
    };
  }

  if (material === "gravel") {
    return {
      backgroundColor: "rgba(108, 112, 118, 0.7)",
      backgroundImage: [
        "linear-gradient(155deg, rgba(76, 79, 84, 0.86), rgba(167, 172, 178, 0.58))",
        "radial-gradient(circle at 16% 24%, rgba(235,238,241,0.42) 0 2px, transparent 2.6px)",
        "radial-gradient(circle at 72% 64%, rgba(53,56,61,0.32) 0 2.4px, transparent 3px)",
      ].join(", "),
      backgroundSize: "cover, 20px 20px, 30px 30px",
      backgroundBlendMode: "normal, screen, multiply",
    };
  }

  return {
    backgroundColor: "rgba(28, 32, 37, 0.76)",
    backgroundImage: [
      "linear-gradient(150deg, rgba(19, 23, 28, 0.96), rgba(66, 71, 78, 0.7))",
      "radial-gradient(circle at 18% 24%, rgba(255,255,255,0.12) 0 1px, transparent 1.5px)",
      "radial-gradient(circle at 74% 70%, rgba(0,0,0,0.32) 0 2px, transparent 2.6px)",
    ].join(", "),
    backgroundSize: "cover, 18px 18px, 26px 26px",
    backgroundBlendMode: "normal, screen, multiply",
  };
}
