"use client";

import { useRef, useState, useCallback, useEffect } from "react";

export interface CapturedPhoto {
  dataUrl: string;
  mimeType: string;
  width: number;
  height: number;
}

interface CameraProps {
  onCapture: (photo: CapturedPhoto) => void;
  onClose?: () => void;
}

type CameraMode = "idle" | "live" | "captured" | "error";

export default function Camera({ onCapture, onClose }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<CameraMode>("idle");
  const [capturedDataUrl, setCapturedDataUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [facingMode, setFacingMode] = useState<"environment" | "user">(
    "environment"
  );
  const [isMirrored, setIsMirrored] = useState(false);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(
    async (facing: "environment" | "user") => {
      stopStream();
      setErrorMessage("");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        setIsMirrored(facing === "user");
        setMode("live");
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Unknown camera error";
        if (
          message.includes("Permission denied") ||
          message.includes("NotAllowedError")
        ) {
          setErrorMessage(
            "Camera permission was denied. Please allow camera access in your browser settings, or use the Upload Image option below."
          );
        } else if (
          message.includes("NotFoundError") ||
          message.includes("DevicesNotFoundError")
        ) {
          setErrorMessage(
            "No camera was found on this device. Please use the Upload Image option below."
          );
        } else {
          setErrorMessage(`Camera error: ${message}`);
        }
        setMode("error");
      }
    },
    [stopStream]
  );

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, [stopStream]);

  const handleOpenCamera = () => {
    startCamera(facingMode);
  };

  const handleFlipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  const handleCapture = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth;
    const h = video.videoHeight;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (isMirrored) {
      ctx.translate(w, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0, w, h);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setCapturedDataUrl(dataUrl);
    stopStream();
    setMode("captured");
  };

  const handleRetake = () => {
    setCapturedDataUrl(null);
    startCamera(facingMode);
  };

  const handleUsePhoto = () => {
    if (!capturedDataUrl || !canvasRef.current) return;
    onCapture({
      dataUrl: capturedDataUrl,
      mimeType: "image/jpeg",
      width: canvasRef.current.width,
      height: canvasRef.current.height,
    });
    stopStream();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const img = new Image();
      img.onload = () => {
        onCapture({
          dataUrl,
          mimeType: file.type,
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
        stopStream();
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          📸 Camera Capture
        </h2>
        {onClose && (
          <button
            onClick={() => {
              stopStream();
              onClose();
            }}
            className="rounded-full p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Close camera"
          >
            ✕
          </button>
        )}
      </div>

      {/* Viewfinder / Preview */}
      <div className="relative overflow-hidden rounded-xl bg-zinc-950 aspect-video flex items-center justify-center">
        {mode === "idle" && (
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <span className="text-5xl">📷</span>
            <p className="text-sm">Camera not started</p>
          </div>
        )}

        {mode === "error" && (
          <div className="flex flex-col items-center gap-3 px-6 text-center text-red-400">
            <span className="text-4xl">⚠️</span>
            <p className="text-sm leading-relaxed">{errorMessage}</p>
          </div>
        )}

        {(mode === "live" || mode === "captured") && (
          <>
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              style={{
                display: mode === "live" ? "block" : "none",
                transform: isMirrored ? "scaleX(-1)" : "none",
              }}
              playsInline
              muted
            />
            {mode === "captured" && capturedDataUrl && (
              <img
                src={capturedDataUrl}
                alt="Captured photo"
                className="h-full w-full object-cover"
              />
            )}
          </>
        )}

        {/* Flip button (only when live) */}
        {mode === "live" && (
          <button
            onClick={handleFlipCamera}
            className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white transition hover:bg-black/70"
            title="Flip camera"
          >
            🔄
          </button>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        {mode === "idle" || mode === "error" ? (
          <button
            onClick={handleOpenCamera}
            className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
          >
            Open Camera
          </button>
        ) : mode === "live" ? (
          <>
            <button
              onClick={handleCapture}
              className="flex-1 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
            >
              📸 Capture
            </button>
            <button
              onClick={() => {
                stopStream();
                setMode("idle");
              }}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancel
            </button>
          </>
        ) : (
          <>
            <button
              onClick={handleUsePhoto}
              className="flex-1 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700 active:scale-95"
            >
              ✅ Use Photo
            </button>
            <button
              onClick={handleRetake}
              className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Retake
            </button>
          </>
        )}

        {/* Upload fallback — always available */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-xl border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          📁 Upload Image
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        Supports JPG, PNG, and WebP. Camera requires browser permission.
      </p>
    </div>
  );
}
