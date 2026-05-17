import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  requestMotionSensorPermission,
  requestBluetoothAccessPermission,
  requestDeviceLocationPermission,
  requestNetworkAccessPermission,
  requestNativeCameraPermission,
  requestNativePhotoPermission,
  schedulePendingGalleryLaunch,
} from "@/lib/deviceMedia";
import {
  AlertTriangle,
  Bluetooth,
  Camera,
  CheckCircle2,
  Compass,
  Dot,
  Loader2,
  MapPin,
  ShieldCheck,
  Upload,
  Wifi,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "wouter";

type PermissionResult = "idle" | "requesting" | "granted" | "denied";
type LaunchFeature = "camera" | "gallery" | "estimator";

const PERMISSION_REVIEW_PREFIX = "easy-asphalt-device-permissions-v6";

function PermissionTile({
  actionLabel = "Allow",
  icon,
  label,
  result,
  requesting,
  required = false,
  openLabel = "Open",
  onOpen,
  onRequest,
}: {
  actionLabel?: string;
  icon: ReactNode;
  label: string;
  openLabel?: string;
  result: PermissionResult;
  requesting: boolean;
  required?: boolean;
  onOpen?: () => void;
  onRequest: () => void;
}) {
  const statusText =
    result === "granted"
      ? "Ready"
      : result === "denied"
        ? "Blocked"
        : result === "requesting"
          ? "Checking"
          : "Needed";
  const statusClass =
    result === "granted"
      ? "border-emerald-400/30 bg-emerald-400/12 text-emerald-200"
      : result === "denied"
        ? "border-red-400/30 bg-red-400/12 text-red-200"
        : result === "requesting"
          ? "border-amber-300/30 bg-amber-300/12 text-amber-100"
          : "border-white/12 bg-white/8 text-slate-200";
  const isDone = result === "granted";
  const isBusy = requesting || result === "requesting";

  return (
    <div className="permission-rise rounded-2xl border border-white/10 bg-[#0b1713] p-3 shadow-[0_18px_50px_rgba(0,0,0,0.24)] transition hover:-translate-y-0.5 hover:border-emerald-300/35 hover:bg-[#10231d]">
      <div className="flex items-center gap-3">
        <span className="permission-breathe flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-emerald-300/24 bg-emerald-400/12 text-emerald-200">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-white">{label}</p>
          <div className="mt-1 flex items-center gap-1 text-xs">
            <span
              className={`inline-flex items-center rounded-full border px-2 py-0.5 font-semibold ${statusClass}`}
            >
              {statusText}
            </span>
            {required && (
              <>
                <Dot className="h-3 w-3 text-slate-500" />
                <span className="font-medium text-slate-300">Required</span>
              </>
            )}
          </div>
        </div>
      </div>
      <Button
        className="mt-3 h-10 w-full rounded-xl border border-emerald-300/24 bg-[#0f7c43] text-white shadow-[0_12px_30px_rgba(57,255,20,0.14)] hover:bg-[#119653]"
        disabled={isBusy || (isDone && !onOpen)}
        onClick={isDone ? onOpen : onRequest}
        type="button"
      >
        {result === "requesting" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : result === "granted" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          icon
        )}
        {isDone ? openLabel : actionLabel}
      </Button>
    </div>
  );
}

export default function DevicePermissionGate({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const utils = trpc.useUtils();
  const [reviewed, setReviewed] = useState(false);
  const [camera, setCamera] = useState<PermissionResult>("idle");
  const [photos, setPhotos] = useState<PermissionResult>("idle");
  const [location, setLocation] = useState<PermissionResult>("idle");
  const [motion, setMotion] = useState<PermissionResult>("idle");
  const [network, setNetwork] = useState<PermissionResult>("idle");
  const [bluetooth, setBluetooth] = useState<PermissionResult>("idle");
  const [requesting, setRequesting] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const storageKey = PERMISSION_REVIEW_PREFIX;
  const bootstrapMutation = trpc.auth.bootstrap.useMutation({
    onSuccess: deviceUser => {
      utils.auth.me.setData(undefined, deviceUser);
    },
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    setReviewed(localStorage.getItem(storageKey) === "reviewed");
  }, [storageKey]);

  const finishReview = ({
    launchFeature,
  }: { launchFeature?: LaunchFeature } = {}) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "reviewed");
    }
    if (launchFeature === "gallery") {
      schedulePendingGalleryLaunch();
    }
    setReviewed(true);
    if (launchFeature) {
      navigate("/estimator");
    }
  };

  const ensureDeviceWorkspace = async () => {
    if (user) return user;

    return bootstrapMutation.mutateAsync();
  };

  useEffect(() => {
    if (!reviewed || user || authLoading || bootstrapMutation.isPending) {
      return;
    }

    if (bootstrapMutation.error) {
      return;
    }

    void ensureDeviceWorkspace();
  }, [
    authLoading,
    bootstrapMutation.error,
    bootstrapMutation.isPending,
    reviewed,
    user,
  ]);

  const requestPermission = async (
    key: "camera" | "photos" | "location" | "motion" | "network" | "bluetooth"
  ) => {
    setPermissionError(null);

    const setters = {
      camera: setCamera,
      photos: setPhotos,
      location: setLocation,
      motion: setMotion,
      network: setNetwork,
      bluetooth: setBluetooth,
    };
    const requesters = {
      camera: requestNativeCameraPermission,
      photos: requestNativePhotoPermission,
      location: requestDeviceLocationPermission,
      motion: requestMotionSensorPermission,
      network: requestNetworkAccessPermission,
      bluetooth: requestBluetoothAccessPermission,
    };

    setters[key]("requesting");

    try {
      const result = await requesters[key]();
      setters[key](result);
      return result;
    } catch {
      setters[key]("denied");
      return "denied" as const;
    }
  };

  const requestAllDeviceAccess = async () => {
    setRequesting(true);
    setPermissionError(null);

    try {
      const cameraResult = await requestPermission("camera");
      await requestPermission("photos");
      await requestPermission("location");
      await requestPermission("motion");
      await requestPermission("network");
      await requestPermission("bluetooth");

      if (cameraResult === "granted") {
        await ensureDeviceWorkspace();
        finishReview();
        return;
      }

      setPermissionError(
        "Camera access is required before the estimator can capture a driveway."
      );
    } finally {
      setRequesting(false);
    }
  };

  const openEstimator = async () => {
    if (camera !== "granted") {
      setPermissionError(
        "Allow Camera first so the estimator can open the capture screen."
      );
      return;
    }

    setRequesting(true);
    setPermissionError(null);
    try {
      await ensureDeviceWorkspace();
      finishReview({ launchFeature: "estimator" });
    } finally {
      setRequesting(false);
    }
  };

  const openGrantedFeature = async (feature: LaunchFeature) => {
    setRequesting(true);
    setPermissionError(null);
    try {
      await ensureDeviceWorkspace();
      finishReview({ launchFeature: feature });
    } finally {
      setRequesting(false);
    }
  };

  if (reviewed && (authLoading || bootstrapMutation.isPending || !user)) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#07100d] px-4 py-8 text-white">
        <section className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#0b1713] p-6 text-center shadow-[0_28px_90px_rgba(0,0,0,0.42)]">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-300/24 bg-emerald-400/12 text-emerald-200">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-white">
            Opening estimator
          </h1>
          <p className="text-sm leading-5 text-slate-300">
            Setting up this device workspace.
          </p>
          {bootstrapMutation.error && (
            <div className="mt-5">
              <Button
                className="bg-[#0f7c43] text-white hover:bg-[#119653]"
                disabled={bootstrapMutation.isPending}
                onClick={() => void ensureDeviceWorkspace()}
              >
                Retry Setup
              </Button>
            </div>
          )}
        </section>
      </main>
    );
  }

  if (reviewed) return <>{children}</>;

  const hasDeniedPermission =
    camera === "denied" ||
    photos === "denied" ||
    location === "denied" ||
    motion === "denied" ||
    network === "denied" ||
    bluetooth === "denied";
  const canOpenEstimator = camera === "granted";
  const allowedCount = [
    camera,
    photos,
    location,
    motion,
    network,
    bluetooth,
  ].filter(result => result === "granted").length;

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#07100d] px-4 py-5 text-white">
      <style>{`
        @keyframes permission-rise {
          from { opacity: 0; transform: translateY(14px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes permission-breathe {
          0%, 100% { box-shadow: 0 0 0 rgba(57,255,20,0); }
          50% { box-shadow: 0 0 24px rgba(57,255,20,0.24); }
        }

        @media (prefers-reduced-motion: no-preference) {
          .permission-rise { animation: permission-rise 520ms ease both; }
          .permission-breathe { animation: permission-breathe 3.8s ease-in-out infinite; }
        }
      `}</style>
      <section className="permission-rise mx-auto w-full max-w-xl rounded-3xl border border-white/10 bg-[#08130f] p-5 shadow-[0_28px_90px_rgba(0,0,0,0.42)] sm:p-6">
        <div className="mb-5 flex items-center gap-4">
          <div className="permission-breathe flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-emerald-300/24 bg-emerald-400/12 text-emerald-200">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase text-emerald-200">
              Device setup
            </p>
            <h1 className="mt-1 text-2xl font-bold text-white">
              Choose access
            </h1>
          </div>
          <div className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs font-bold text-slate-100">
            {allowedCount}/6
          </div>
        </div>

        {permissionError && (
          <div
            className="mb-4 flex gap-3 rounded-2xl border border-red-400/30 bg-red-400/12 p-3 text-sm leading-5 text-red-100"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{permissionError}</span>
          </div>
        )}

        <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <PermissionTile
            actionLabel="Allow"
            icon={<Camera className="h-4 w-4" />}
            label="Camera"
            onOpen={() => void openGrantedFeature("camera")}
            onRequest={() => void requestPermission("camera")}
            openLabel="Open Capture"
            requesting={requesting}
            result={camera}
            required
          />
          <PermissionTile
            actionLabel="Allow"
            icon={<Upload className="h-4 w-4" />}
            label="Uploads"
            onOpen={() => void openGrantedFeature("gallery")}
            onRequest={() => void requestPermission("photos")}
            openLabel="Open Upload"
            requesting={requesting}
            result={photos}
          />
          <PermissionTile
            actionLabel="Allow"
            icon={<MapPin className="h-4 w-4" />}
            label="Location"
            onOpen={() => void openGrantedFeature("estimator")}
            onRequest={() => void requestPermission("location")}
            openLabel="Open GPS"
            requesting={requesting}
            result={location}
          />
          <PermissionTile
            actionLabel="Allow"
            icon={<Compass className="h-4 w-4" />}
            label="Motion"
            onOpen={() => void openGrantedFeature("estimator")}
            onRequest={() => void requestPermission("motion")}
            openLabel="Open Motion"
            requesting={requesting}
            result={motion}
          />
          <PermissionTile
            actionLabel="Check"
            icon={<Wifi className="h-4 w-4" />}
            label="Network"
            onOpen={() => void openGrantedFeature("estimator")}
            onRequest={() => void requestPermission("network")}
            openLabel="Open Pricing"
            requesting={requesting}
            result={network}
            required
          />
          <PermissionTile
            actionLabel="Check"
            icon={<Bluetooth className="h-4 w-4" />}
            label="Bluetooth"
            onOpen={() => void openGrantedFeature("estimator")}
            onRequest={() => void requestPermission("bluetooth")}
            openLabel="Open Live"
            requesting={requesting}
            result={bluetooth}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            className="h-11 rounded-xl border border-emerald-300/24 bg-[#0f7c43] text-white shadow-[0_12px_30px_rgba(57,255,20,0.14)] hover:bg-[#119653]"
            disabled={requesting}
            onClick={requestAllDeviceAccess}
            type="button"
          >
            {requesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Allow all
          </Button>
          <Button
            className="h-11 rounded-xl border-white/14 bg-white/8 text-white hover:bg-white/14"
            disabled={requesting || !canOpenEstimator}
            onClick={openEstimator}
            type="button"
            variant="outline"
          >
            <Camera className="h-4 w-4" />
            Open estimator
          </Button>
        </div>

        {hasDeniedPermission && (
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/8 p-3 text-xs leading-5 text-slate-300">
            Denied access can be changed later in Android app settings. Camera
            is required to start capture.
          </p>
        )}
      </section>
    </main>
  );
}
