import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  requestMotionSensorPermission,
  requestDeviceLocationPermission,
  requestNativeCameraPermission,
  requestNativePhotoPermission,
  schedulePendingCameraLaunch,
} from "@/lib/deviceMedia";
import {
  Camera,
  Compass,
  Loader2,
  MapPin,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type PermissionResult = "idle" | "requesting" | "granted" | "denied";

const PERMISSION_REVIEW_PREFIX = "easy-asphalt-device-permissions-v3";

function getPermissionStorageKey() {
  return PERMISSION_REVIEW_PREFIX;
}

function PermissionRow({
  icon,
  label,
  result,
}: {
  icon: ReactNode;
  label: string;
  result: PermissionResult;
}) {
  const statusText =
    result === "granted"
      ? "Allowed"
      : result === "denied"
        ? "Not allowed"
        : result === "requesting"
          ? "Requesting"
          : "Waiting";

  return (
    <div className="flex items-center justify-between rounded-xl border border-[#204f17] bg-[#020b00] px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-[#39ff14]/10 text-[#39ff14]">
          {icon}
        </span>
        <span className="font-medium text-[#e2ffd8]">{label}</span>
      </div>
      <span className="text-sm text-[#9fe788]">{statusText}</span>
    </div>
  );
}

export default function DevicePermissionGate({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const utils = trpc.useUtils();
  const [reviewed, setReviewed] = useState(false);
  const [camera, setCamera] = useState<PermissionResult>("idle");
  const [photos, setPhotos] = useState<PermissionResult>("idle");
  const [location, setLocation] = useState<PermissionResult>("idle");
  const [motion, setMotion] = useState<PermissionResult>("idle");
  const [requesting, setRequesting] = useState(false);
  const [cameraReadyForLaunch, setCameraReadyForLaunch] = useState(false);
  const storageKey = useMemo(() => getPermissionStorageKey(), []);
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
    launchCamera = false,
  }: { launchCamera?: boolean } = {}) => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "reviewed");
    }
    if (launchCamera) {
      schedulePendingCameraLaunch();
    }
    setReviewed(true);
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

  const requestDeviceAccess = async () => {
    setRequesting(true);
    setCamera("requesting");
    setPhotos("requesting");
    setLocation("requesting");
    setMotion("requesting");

    const cameraResult = await requestNativeCameraPermission();
    const photosResult = await requestNativePhotoPermission();
    const locationResult = await requestDeviceLocationPermission();
    const motionResult = await requestMotionSensorPermission();

    setCamera(cameraResult);
    setPhotos(photosResult);
    setLocation(locationResult);
    setMotion(motionResult);
    setCameraReadyForLaunch(cameraResult === "granted");

    if (cameraResult === "granted") {
      try {
        await ensureDeviceWorkspace();
      } finally {
        setRequesting(false);
      }
      finishReview({ launchCamera: true });
      return;
    }

    setRequesting(false);
  };

  if (reviewed && (authLoading || bootstrapMutation.isPending || !user)) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#010400] px-4 py-8 text-[#c7ffb5] [color-scheme:dark]">
        <section className="w-full max-w-lg rounded-2xl border border-[#246416] bg-[#041103]/95 p-6 text-center shadow-[0_0_0_1px_rgba(57,255,20,0.12),0_24px_80px_rgba(0,0,0,0.55)] sm:p-8">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#39ff14]/12 text-[#39ff14]">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <h1 className="mb-3 text-2xl font-semibold text-[#39ff14]">
            Preparing your device workspace
          </h1>
          <p className="text-sm leading-6 text-[#9fe788]">
            Permissions are saved. We are finishing setup so your saved
            projects, estimates, and contractor tools are ready on this device.
          </p>
          {bootstrapMutation.error && (
            <div className="mt-6">
              <Button
                className="border border-[#39ff14]/35 bg-[#123c0f] text-[#39ff14] hover:bg-[#195314]"
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
    motion === "denied";

  return (
    <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-[#010400] px-4 py-8 text-[#c7ffb5] [color-scheme:dark]">
      <section className="w-full max-w-lg rounded-2xl border border-[#246416] bg-[#041103]/95 p-6 shadow-[0_0_0_1px_rgba(57,255,20,0.12),0_24px_80px_rgba(0,0,0,0.55)] sm:p-8">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#39ff14]/12 text-[#39ff14]">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="mb-3 text-2xl font-semibold text-[#39ff14]">
          Allow device access
        </h1>
        <p className="mb-3 text-sm leading-6 text-[#9fe788]">
          The estimator needs camera access for driveway photos, photo library
          access for uploads, location access for local material pricing, and
          motion sensors to help keep capture angle and phone alignment stable.
        </p>
        <p className="mb-6 text-xs leading-5 text-[#78bf64]">
          After camera access is granted, the app will open the capture screen
          automatically.
        </p>

        <div className="mb-7 space-y-3">
          <PermissionRow
            icon={<Camera className="h-4 w-4" />}
            label="Camera"
            result={camera}
          />
          <PermissionRow
            icon={<Upload className="h-4 w-4" />}
            label="Photo Library"
            result={photos}
          />
          <PermissionRow
            icon={<MapPin className="h-4 w-4" />}
            label="Location"
            result={location}
          />
          <PermissionRow
            icon={<Compass className="h-4 w-4" />}
            label="Motion Sensors"
            result={motion}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1 border border-[#39ff14]/35 bg-[#123c0f] text-[#39ff14] hover:bg-[#195314]"
            disabled={requesting}
            onClick={requestDeviceAccess}
          >
            {requesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Allow access
          </Button>
          {hasDeniedPermission && (
            <Button
              className="flex-1 border-[#2b6e1b] bg-transparent text-[#afff98] hover:bg-[#0d220a] hover:text-[#d7ffcd]"
              onClick={() =>
                finishReview({ launchCamera: cameraReadyForLaunch })
              }
              variant="outline"
            >
              Continue with limited access
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
