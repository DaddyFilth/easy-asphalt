export type SubscriptionTier = "free" | "premium";

export interface SubscriptionFeatures {
  tier: SubscriptionTier;
  features: {
    // Core features
    basicEstimation: boolean;
    materialPreview: boolean;
    projectSaving: boolean;
    projectSharing: boolean;
    pdfExport: boolean;
    cameraAccess: boolean;
    
    // Premium features
    realSupplierPricing: boolean;
    contractorDashboard: boolean;
    offlineMode: boolean;
    lidarDepthSensing: boolean;
    advancedMaterials: boolean;
    prioritySupport: boolean;
    customBranding: boolean;
    unlimitedProjects: boolean;
  };
}

export const SUBSCRIPTION_FEATURES: Record<SubscriptionTier, SubscriptionFeatures> = {
  free: {
    tier: "free",
    features: {
      basicEstimation: true,
      materialPreview: true,
      projectSaving: true,
      projectSharing: true,
      pdfExport: true,
      cameraAccess: true,
      realSupplierPricing: false,
      contractorDashboard: false,
      offlineMode: false,
      lidarDepthSensing: false,
      advancedMaterials: false,
      prioritySupport: false,
      customBranding: false,
      unlimitedProjects: false,
    },
  },
  premium: {
    tier: "premium",
    features: {
      basicEstimation: true,
      materialPreview: true,
      projectSaving: true,
      projectSharing: true,
      pdfExport: true,
      cameraAccess: true,
      realSupplierPricing: true,
      contractorDashboard: true,
      offlineMode: true,
      lidarDepthSensing: true,
      advancedMaterials: true,
      prioritySupport: true,
      customBranding: true,
      unlimitedProjects: true,
    },
  },
};

export const PREMIUM_FEATURES = [
  {
    id: "realSupplierPricing",
    name: "Real Supplier Pricing",
    description: "Live pricing from local suppliers instead of estimates",
    icon: "💰",
  },
  {
    id: "contractorDashboard",
    name: "Contractor Dashboard",
    description: "Manage all incoming project requests in one place",
    icon: "📊",
  },
  {
    id: "offlineMode",
    name: "Offline Mode",
    description: "Work in the field without internet connection",
    icon: "📱",
  },
  {
    id: "lidarDepthSensing",
    name: "LiDAR Depth Sensing",
    description: "Automatic depth measurement on iPhone Pro devices",
    icon: "📏",
  },
  {
    id: "advancedMaterials",
    name: "Advanced Materials",
    description: "Access to specialized material types and finishes",
    icon: "🎨",
  },
  {
    id: "prioritySupport",
    name: "Priority Support",
    description: "24/7 support with faster response times",
    icon: "⚡",
  },
  {
    id: "customBranding",
    name: "Custom Branding",
    description: "Add your logo and colors to estimates",
    icon: "🏷️",
  },
  {
    id: "unlimitedProjects",
    name: "Unlimited Projects",
    description: "Save unlimited projects (free tier: 10/month)",
    icon: "∞",
  },
];

export const PRICING_PLANS = [
  {
    tier: "free" as SubscriptionTier,
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Perfect for homeowners and occasional use",
    features: [
      "Basic driveway estimation",
      "4 material types",
      "10 projects per month",
      "Project sharing & PDF export",
      "Camera access",
    ],
    cta: "Get Started",
  },
  {
    tier: "premium" as SubscriptionTier,
    name: "Premium",
    price: "$29",
    period: "per month",
    description: "For contractors and power users",
    features: [
      "Everything in Free",
      "Unlimited projects",
      "Real supplier pricing",
      "Contractor dashboard",
      "Offline mode",
      "LiDAR depth sensing",
      "Advanced materials",
      "Priority support",
    ],
    cta: "Start Free Trial",
    popular: true,
  },
];

export function hasFeature(
  userTier: SubscriptionTier,
  feature: keyof SubscriptionFeatures["features"]
): boolean {
  return SUBSCRIPTION_FEATURES[userTier].features[feature];
}

export function canAccessFeature(
  userTier: SubscriptionTier,
  feature: keyof SubscriptionFeatures["features"]
): { allowed: boolean; reason?: string } {
  const allowed = hasFeature(userTier, feature);
  
  if (!allowed) {
    const featureInfo = PREMIUM_FEATURES.find(f => f.id === feature);
    return {
      allowed: false,
      reason: featureInfo 
        ? `${featureInfo.name} is a Premium feature. Upgrade to access.`
        : "This feature requires a Premium subscription.",
    };
  }
  
  return { allowed: true };
}
