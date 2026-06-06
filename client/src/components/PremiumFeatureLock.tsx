import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Zap } from "lucide-react";

interface PremiumFeatureLockProps {
  isOpen: boolean;
  onClose: () => void;
  featureName: string;
  featureDescription?: string;
}

export function PremiumFeatureLock({
  isOpen,
  onClose,
  featureName,
  featureDescription,
}: PremiumFeatureLockProps) {
  const handleUpgrade = () => {
    onClose();
    window.location.href = "/pricing";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              <Crown className="w-3 h-3 mr-1" />
              Premium Feature
            </Badge>
          </div>
          <DialogTitle className="text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            {featureName}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {featureDescription || "This advanced feature is available with Premium subscription."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/20">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-purple-400 mt-0.5" />
              <div>
                <p className="text-white font-semibold mb-1">
                  Unlock with Premium
                </p>
                <p className="text-slate-300 text-sm">
                  Get access to {featureName.toLowerCase()} and 7+ other premium features for just $29/month.
                </p>
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm font-semibold text-slate-300">Premium includes:</p>
            <ul className="space-y-1 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                Real supplier pricing
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                Contractor dashboard
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                Offline mode
              </li>
              <li className="flex items-center gap-2">
                <span className="text-emerald-400">✓</span>
                Unlimited projects
              </li>
            </ul>
          </div>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            Maybe Later
          </Button>
          <Button
            onClick={handleUpgrade}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Crown className="w-4 h-4 mr-2" />
            Upgrade Now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
