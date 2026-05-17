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
  AlertTriangle,
  Camera,
  CheckCircle2,
  Compass,
  Loader2,
  MapPin,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type PermissionResult = "idle" | "requesting" | "granted" | "denied";

const PERMISSION_REVIEW_PREFIX = "easy-asphalt-device-permissions-v4";

function getPermissionStorageKey() {
  return PERMISSION_REVIEW_PREFIX;
}

function PermissionRow({
  icon,
  label,
  description,
  result,
  requesting,
  required = false,
  onRequest,
}: {
  icon: ReactNode;
  label: string;
  description: string;
  result: PermissionResult;
  requesting: boolean;
  required?: boolean;
  onRequest: () => void;
}) {
  const statusText =
    result === "granted"
      ? "Allowed"
      : result === "denied"
        ? "Not allowed"
        : result === "requesting"
          ? "Requesting"
          : "Waiting";
  const statusClass =
    result === "granted"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : result === "denied"
        ? "border-red-200 bg-red-50 text-red-800"
        : result === "requesting"
          ? "border-amber-200 bg-amber-50 text-amber-800"
          : "border-slate-200 bg-slate-50 text-slate-700";

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-slate-900 text-emerald-300">
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-semibold text-slate-950">{label}</span>
            {required && (
              <span className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-amber-800">
                Required
              </span>
            )}
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${statusClass}`}
            >
              {statusText}
            </span>
          </div>
          <p className="mt-1 text-sm leading-5 text-slate-700">
            {description}
          </p>
        </div>
      </div>
      <Button
        className="mt-4 w-full bg-slate-950 text-white hover:bg-slate-800"
        disabled={requesting || result === "requesting" || result === "granted"}
        onClick={onRequest}
        type="button"
      >
        {result === "requesting" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : result === "granted" ? (
          <CheckCircle2 className="h-4 w-4" />
        ) : (
          icon
        )}
        {result === "granted" ? "Allowed" : `Allow ${label}`}
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
  const utils = trpc.useUtils();
  const [reviewed, setReviewed] = useState(false);
  const [camera, setCamera] = useState<PermissionResult>("idle");
  const [photos, setPhotos] = useState<PermissionResult>("idle");
  const [location, setLocation] = useState<PermissionResult>("idle");
  const [motion, setMotion] = useState<PermissionResult>("idle");
  const [requesting, setRequesting] = useState(false);
  const [cameraReadyForLaunch, setCameraReadyForLaunch] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
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

  const requestPermission = async (
    key: "camera" | "photos" | "location" | "motion"
  ) => {
    setPermissionError(null);

    const setters = {
      camera: setCamera,
      photos: setPhotos,
      location: setLocation,
      motion: setMotion,
    };
    const requesters = {
      camera: requestNativeCameraPermission,
      photos: requestNativePhotoPermission,
      location: requestDeviceLocationPermission,
      motion: requestMotionSensorPermission,
    };

    setters[key]("requesting");

    try {
      const result = await requesters[key]();
      setters[key](result);
      if (key === "camera") {
        setCameraReadyForLaunch(result === "granted");
      }
      return result;
    } catch {
      setters[key]("denied");
      if (key === "camera") {
        setCameraReadyForLaunch(false);
      }
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

      if (cameraResult === "granted") {
        await ensureDeviceWorkspace();
        finishReview({ launchCamera: true });
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
      finishReview({ launchCamera: true });
    } finally {
      setRequesting(false);
    }
  };

  if (reviewed && (authLoading || bootstrapMutation.isPending || !user)) {
    return (
      <main className="flex min-h-screen items-center justify-center overflow-x-hidden bg-slate-100 px-4 py-8 text-slate-950">
        <section className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-center shadow-xl sm:p-8">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-slate-950 text-emerald-300">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
          <h1 className="mb-3 text-2xl font-semibold text-slate-950">
            Preparing your device workspace
          </h1>
          <p className="text-sm leading-6 text-slate-700">
            Permissions are saved. We are finishing setup so your saved
            projects, estimates, and contractor tools are ready on this device.
          </p>
          {bootstrapMutation.error && (
            <div className="mt-6">
              <Button
                className="bg-slate-950 text-white hover:bg-slate-800"
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
  const canOpenEstimator = camera === "granted";

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 px-4 py-6 text-slate-950">
      <section className="mx-auto w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-5 shadow-xl sm:p-7">
        <div className="mb-5 flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-slate-950 text-emerald-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              Set up device access
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Turn on each feature the sales estimator can use. Camera is
              required for capture; uploads, location, and motion make field
              estimates easier and more accurate.
            </p>
          </div>
        </div>

        {permissionError && (
          <div
            className="mb-4 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm leading-5 text-red-800"
            role="alert"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{permissionError}</span>
          </div>
        )}

        <div className="mb-5 grid gap-3">
          <PermissionRow
            icon={<Camera className="h-4 w-4" />}
            label="Camera"
            description="Capture the driveway and open the live camera view."
            onRequest={() => void requestPermission("camera")}
            requesting={requesting}
            result={camera}
            required
          />
          <PermissionRow
            icon={<Upload className="h-4 w-4" />}
            label="Uploads"
            description="Choose driveway photos from the device gallery."
            onRequest={() => void requestPermission("photos")}
            requesting={requesting}
            result={photos}
          />
          <PermissionRow
            icon={<MapPin className="h-4 w-4" />}
            label="Location"
            description="Use the job-site position for local pricing context."
            onRequest={() => void requestPermission("location")}
            requesting={requesting}
            result={location}
          />
          <PermissionRow
            icon={<Compass className="h-4 w-4" />}
            label="Motion"
            description="Read phone angle to help keep capture alignment steady."
            onRequest={() => void requestPermission("motion")}
            requesting={requesting}
            result={motion}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            className="bg-slate-950 text-white hover:bg-slate-800"
            disabled={requesting}
            onClick={requestAllDeviceAccess}
            type="button"
          >
            {requesting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Allow all features
          </Button>
          <Button
            className="border-slate-300 bg-white text-slate-950 hover:bg-slate-100"
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
          <p className="mt-4 text-xs leading-5 text-slate-600">
            If Android shows a denied permission, open system settings for this
            app and enable that feature there. Camera must be allowed before the
            estimator can start capture.
          </p>
        )}
      </section>
    </main>
  );
}
