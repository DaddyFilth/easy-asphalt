import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { X, Loader2 } from "lucide-react";
import {
  takeDrivewayPhotoWithCamera,
  chooseDrivewayPhotoFromGallery,
  isMediaSelectionCanceled,
} from "@/lib/deviceMedia";
import { toast } from "sonner";

interface LiveCameraViewProps {
  onCapture?: (file: File) => void;
  onClose?: () => void;
}

export default function LiveCameraView({ onCapture, onClose }: LiveCameraViewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [hasCamera, setHasCamera] = useState(true);

  // Initialize camera stream on mount
  useEffect(() => {
    const initCamera = async () => {
      try {
        setIsLoading(true);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment" },
          audio: false,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setHasCamera(true);
        setCameraError(null);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        setCameraError(`Camera error: ${message}`);
        setHasCamera(false);
        console.error("Camera initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initCamera();

    return () => {
      // Cleanup: stop camera stream
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleCapture = async () => {
    if (!canvasRef.current || !videoRef.current) return;

    try {
      setIsLoading(true);
      const context = canvasRef.current.getContext("2d");
      if (!context) return;

      // Set canvas dimensions to match video
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;

      // Draw video frame to canvas
      context.drawImage(videoRef.current, 0, 0);

      // Convert canvas to blob
      canvasRef.current.toBlob(
        blob => {
          if (blob) {
            const file = new File([blob], "camera-capture.jpg", {
              type: "image/jpeg",
            });
            onCapture?.(file);
            toast.success("Photo captured successfully");
          }
        },
        "image/jpeg",
        0.9
      );
    } catch (error) {
      console.error("Capture error:", error);
      toast.error("Failed to capture photo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGalleryUpload = async () => {
    try {
      setIsLoading(true);
      const file = await chooseDrivewayPhotoFromGallery();
      if (file) {
        onCapture?.(file);
        toast.success("Photo selected from gallery");
      }
    } catch (error) {
      if (!isMediaSelectionCanceled(error)) {
        toast.error("Failed to select photo from gallery");
        console.error("Gallery selection error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNativeCamera = async () => {
    try {
      setIsLoading(true);
      const file = await takeDrivewayPhotoWithCamera();
      if (file) {
        onCapture?.(file);
        toast.success("Photo captured with native camera");
      }
    } catch (error) {
      if (!isMediaSelectionCanceled(error)) {
        toast.error("Failed to capture photo with native camera");
        console.error("Native camera error:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Live Camera</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-700 rounded-lg transition-colors"
          aria-label="Close camera"
        >
          <X className="w-5 h-5 text-slate-300" />
        </button>
      </div>

      {/* Camera/Error Area */}
      <div className="flex-1 bg-black flex items-center justify-center relative overflow-hidden">
        {cameraError ? (
          <div className="text-center p-6">
            <div className="text-yellow-400 mb-4">⚠️</div>
            <p className="text-slate-300 text-sm mb-4">{cameraError}</p>
            <p className="text-slate-400 text-xs mb-6">
              {hasCamera
                ? "Please allow camera access in your browser settings"
                : "Your device may not have a camera"}
            </p>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
            {isLoading && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-white animate-spin" />
              </div>
            )}
          </>
        )}
        <canvas ref={canvasRef} className="hidden" />
      </div>

      {/* Controls */}
      <div className="p-4 border-t border-slate-700 bg-slate-800/50 space-y-3">
        <div className="flex gap-2">
          <button
            onClick={handleCapture}
            disabled={isLoading || !hasCamera}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Capturing...
              </>
            ) : (
              <>
                📸 Capture Photo
              </>
            )}
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleGalleryUpload}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
          >
            📁 Gallery
          </button>
          <button
            onClick={handleNativeCamera}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700/50 text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-colors text-sm"
          >
            📱 Native Camera
          </button>
        </div>

        <p className="text-xs text-slate-400 text-center">
          Capture a clear photo of your driveway for accurate measurements
        </p>
      </div>
    </div>
  );
}
