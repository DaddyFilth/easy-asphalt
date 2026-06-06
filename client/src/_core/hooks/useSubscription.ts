import type { SubscriptionTier } from "@shared/subscription";

export function useSubscription() {
  const getTier = (): SubscriptionTier => {
    if (typeof window === "undefined") return "free";
    const savedTier = localStorage.getItem("subscription-tier");
    return (savedTier === "premium" || savedTier === "free") ? savedTier : "free";
  };

  const setTier = (tier: SubscriptionTier) => {
    if (typeof window === "undefined") return;
    localStorage.setItem("subscription-tier", tier);
  };

  const tier = getTier();
  const isPremium = tier === "premium";

  return {
    tier,
    setTier,
    isPremium,
    upgradeOpen: false,
    setUpgradeOpen: () => {},
  };
}
