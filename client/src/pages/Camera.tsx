import { useRef, useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { CameraIcon, X } from "lucide-react";

export default function Camera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [, setLocation] = useLocation();

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  useEffect(() => {
    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err: unknown) {
        const msg = err instanceof DOMException
          ? err.name === "NotAllowedError"
            ? "Camera permission denied. Enable camera access in your device settings."
            : err.name === "NotFoundError"
              ? "No camera found on this device."
              : `Camera error: ${err.message}`
          : "Unable to start the camera.";
        setError(msg);
      }
    }
    startCamera();
    return () => stopCamera();
  }, [stopCamera]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    canvas.toBlob(blob => {
      if (blob) {
        stopCamera();
        setLocation("/estimator?start=upload");
      }
    }, "image/jpeg", 0.9);
  }, [stopCamera, setLocation]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {error ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <CameraIcon className="h-12 w-12 text-white/40" />
          <p className="text-sm font-medium text-white/70">{error}</p>
          <button
            onClick={() => setLocation("/")}
            className="rounded-lg border border-white/20 bg-white/10 px-5 py-2 text-sm font-bold text-white hover:bg-white/20"
          >
            Go Back
          </button>
        </div>
      ) : (
        <>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className="flex-1 object-cover"
          />
          <div className="absolute top-4 left-4">
            <button
              onClick={() => {
                stopCamera();
                setLocation("/");
              }}
              className="grid h-10 w-10 place-items-center rounded-full bg-black/50 text-white hover:bg-black/70"
              aria-label="Close camera"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <button
              onClick={handleCapture}
              className="h-16 w-16 rounded-full border-4 border-white/70 flex items-center justify-center hover:border-[#39ff14] transition-colors"
              aria-label="Take photo"
            >
              <div className="h-12 w-12 rounded-full border-2 border-white/30" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
