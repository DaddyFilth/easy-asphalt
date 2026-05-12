import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  requestDeviceLocationPermission,
  requestNativeCameraPermission,
  requestNativePhotoPermission,
} from "@/lib/deviceMedia";
import { Camera, Loader2, MapPin, ShieldCheck, Upload } from "lucide-react";
import { useEffect, useMemo, useState, type ReactNode } from "react";

type PermissionResult = "idle" | "requesting" | "granted" | "denied";

const PERMISSION_REVIEW_PREFIX = "easy-asphalt-device-permissions-v2";

function getPermissionStorageKey(user: unknown) {
  if (!user || typeof user !== "object") return PERMISSION_REVIEW_PREFIX;

  const maybeUser = user as { openId?: unknown; email?: unknown; id?: unknown };
  const userKey = maybeUser.openId ?? maybeUser.email ?? maybeUser.id ?? "user";

  return `${PERMISSION_REVIEW_PREFIX}:${String(userKey)}`;
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
    <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/70 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-blue-500/10 text-blue-300">
          {icon}
        </span>
        <span className="font-medium text-white">{label}</span>
      </div>
      <span className="text-sm text-slate-300">{statusText}</span>
    </div>
  );
}

export default function DevicePermissionGate({
  children,
}: {
  children: ReactNode;
}) {
  const { user } = useAuth();
  const [reviewed, setReviewed] = useState(false);
  const [camera, setCamera] = useState<PermissionResult>("idle");
  const [photos, setPhotos] = useState<PermissionResult>("idle");
  const [location, setLocation] = useState<PermissionResult>("idle");
  const [requesting, setRequesting] = useState(false);
  const storageKey = useMemo(() => getPermissionStorageKey(user), [user]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    setReviewed(localStorage.getItem(storageKey) === "reviewed");
  }, [storageKey]);

  const finishReview = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem(storageKey, "reviewed");
    }
    setReviewed(true);
  };

  const requestDeviceAccess = async () => {
    setRequesting(true);
    setCamera("requesting");
    setPhotos("requesting");
    setLocation("requesting");

    const cameraResult = await requestNativeCameraPermission();
    const photosResult = await requestNativePhotoPermission();
    const locationResult = await requestDeviceLocationPermission();

    setCamera(cameraResult);
    setPhotos(photosResult);
    setLocation(locationResult);
    setRequesting(false);

    if (
      cameraResult === "granted" &&
      photosResult === "granted" &&
      locationResult === "granted"
    ) {
      finishReview();
    }
  };

  if (reviewed) return <>{children}</>;

  const hasDeniedPermission =
    camera === "denied" || photos === "denied" || location === "denied";

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <section className="w-full max-w-lg rounded-lg border border-slate-800 bg-slate-900 p-8 shadow-xl">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-300">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <h1 className="mb-3 text-2xl font-semibold">Allow device access</h1>
        <p className="mb-6 text-sm leading-6 text-slate-300">
          The estimator needs camera access for driveway photos, photo library
          access for uploads, and location access for local material pricing.
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
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1 bg-blue-600 hover:bg-blue-700"
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
            <Button className="flex-1" onClick={finishReview} variant="outline">
              Continue with limited access
            </Button>
          )}
        </div>
      </section>
    </main>
  );
}
