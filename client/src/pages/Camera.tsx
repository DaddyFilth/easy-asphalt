import { Camera as DeviceCamera, CameraDirection, EncodingType } from "@capacitor/camera";
import { Capacitor } from "@capacitor/core";
import { CameraIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Camera() {
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      setLocation("/estimator");
      return;
    }

    DeviceCamera.requestPermissions({ permissions: ["camera"] })
      .then(status => {
        if (status.camera !== "granted" && status.camera !== "limited") {
          setError("Camera permission denied.");
          return Promise.reject();
        }
      })
      .then(() =>
        DeviceCamera.getPhoto({
          quality: 90,
          targetWidth: 1920,
          targetHeight: 1920,
          correctOrientation: true,
          encodingType: EncodingType.JPEG,
          saveToGallery: false,
          cameraDirection: CameraDirection.Rear,
          allowEditing: false,
        })
      )
      .then(result => {
        if (result?.path || result?.dataUrl || result?.webPath) {
          const photoUrl = result.webPath || result.dataUrl || null;
          if (photoUrl) {
            sessionStorage.setItem("captured-photo-url", photoUrl);
          }
        }
        setLocation("/estimator");
      })
      .catch(err => {
        if (typeof err === "object" && err !== null && "message" in err) {
          const msg = String(err.message);
          if (/cancel|cancelled/i.test(msg)) {
            setLocation("/");
            return;
          }
        }
        setError("Unable to access camera.");
      });
  }, [setLocation]);

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black px-6 text-center">
        <CameraIcon className="h-12 w-12 text-white/40" />
        <p className="text-sm font-medium text-white/70">{error}</p>
        <button
          onClick={() => setLocation("/")}
          className="rounded-lg border border-white/20 bg-white/10 px-5 py-2 text-sm font-bold text-white hover:bg-white/20"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-black">
      <Loader2 className="h-8 w-8 animate-spin text-white/40" />
      <p className="text-sm font-medium text-white/60">Opening camera...</p>
    </div>
  );
}
