import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import {
  getLiveOverlayStyle,
  materialDisplayNames,
  type Material,
} from "@/lib/estimatorModel";
import { Camera, Loader2, RefreshCw, Home, ArrowLeft } from "lucide-react";
import { toast } from "sonner";

type LiveStatus = "idle" | "starting" | "ready" | "error" | "unsupported";

export default function LiveView() {
  const [selectedMaterial, setSelectedMaterial] = useState<Material>("hotmix");
  const [liveStatus, setLiveStatus] = useState<LiveStatus>("idle");
  const [liveError, setLiveError] = useState<string | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);
  const [overlayIntensity, setOverlayIntensity] = useState(75);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const stopLiveStream = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };

    let cancelled = false;

    const startLiveStream = async () => {
      if (
        typeof navigator === "undefined" ||
        !navigator.mediaDevices?.getUserMedia
      ) {
        setLiveStatus("unsupported");
        setLiveError(
          "Live camera is not available on this device."
        );
        return;
      }

      setLiveStatus("starting");
      setLiveError(null);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: "environment", // Rear camera
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (cancelled) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }

        setLiveStatus("ready");
      } catch (error) {
        console.error(error);
        if (cancelled) return;

        setLiveStatus("error");
        setLiveError(
          "Could not access camera. Please check camera permissions."
        );
      }
    };

    startLiveStream();

    return () => {
      cancelled = true;
      stopLiveStream();
    };
  }, []);

  const handleRestartCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setLiveStatus("idle");
    setLiveError(null);
  };

  useEffect(() => {
    if (liveStatus === "idle") {
      // Trigger restart when status is reset to idle
      const timer = setTimeout(() => {
        setLiveStatus("starting");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [liveStatus]);

  const materials: Material[] = ["hotmix", "millings", "tar_and_chip", "gravel"];
  const materialIcons: Record<Material, string> = {
    hotmix: "🛣️",
    millings: "♻️",
    tar_and_chip: "🪨",
    gravel: "⚫",
  };

  const overlayStyle = {
    ...getLiveOverlayStyle(selectedMaterial),
    opacity: overlayIntensity / 100,
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button
              onClick={() => window.location.href = "/"}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
              Live Material Preview
            </h1>
            <p className="text-slate-300">
              Real-time material visualization for on-site assessment
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setShowOverlay(!showOverlay)}
              variant={showOverlay ? "default" : "outline"}
              className={showOverlay ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-slate-600 text-slate-300 hover:bg-slate-700"}
            >
              {showOverlay ? "Overlay On" : "Overlay Off"}
            </Button>
            <Button
              onClick={handleRestartCamera}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Restart Camera
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Camera View */}
          <div className="lg:col-span-2">
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative aspect-video bg-black">
                  {/* Camera Feed */}
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="h-full w-full object-cover"
                  />

                  {/* Material Overlay */}
                  {showOverlay && liveStatus === "ready" && (
                    <div className="absolute inset-0">
                      <div
                        className="absolute inset-0"
                        style={overlayStyle}
                      />
                    </div>
                  )}

                  {/* Status Overlays */}
                  {liveStatus !== "ready" && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 p-6 text-center">
                      <div className="max-w-sm">
                        {liveStatus === "starting" && (
                          <>
                            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                            <p className="text-white font-semibold mb-2">
                              Starting camera...
                            </p>
                            <p className="text-slate-300 text-sm">
                              Accessing rear camera for live preview
                            </p>
                          </>
                        )}
                        {liveStatus === "error" && (
                          <>
                            <Camera className="w-12 h-12 text-red-400 mx-auto mb-4" />
                            <p className="text-white font-semibold mb-2">
                              Camera Error
                            </p>
                            <p className="text-slate-300 text-sm mb-4">
                              {liveError || "Unable to access camera"}
                            </p>
                            <Button
                              onClick={handleRestartCamera}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Try Again
                            </Button>
                          </>
                        )}
                        {liveStatus === "unsupported" && (
                          <>
                            <Camera className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
                            <p className="text-white font-semibold mb-2">
                              Not Supported
                            </p>
                            <p className="text-slate-300 text-sm mb-4">
                              {liveError || "Live camera not available on this device"}
                            </p>
                            <Button
                              onClick={() => window.location.href = "/estimator"}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              Use Photo Upload
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Live Badge */}
                  {liveStatus === "ready" && (
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-red-500 text-white border-red-500">
                        ● LIVE
                      </Badge>
                    </div>
                  )}

                  {/* Current Material Badge */}
                  {liveStatus === "ready" && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-black/70 text-white border-white/20">
                        {materialIcons[selectedMaterial]} {materialDisplayNames[selectedMaterial]}
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Controls Panel */}
          <div className="space-y-6">
            {/* Material Selection */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Select Material</CardTitle>
                <CardDescription className="text-slate-400">
                  Choose a material to preview
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {materials.map(material => (
                  <Button
                    key={material}
                    onClick={() => setSelectedMaterial(material)}
                    variant={selectedMaterial === material ? "default" : "outline"}
                    className={`w-full justify-start ${
                      selectedMaterial === material
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "border-slate-600 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    <span className="text-xl mr-3">{materialIcons[material]}</span>
                    {materialDisplayNames[material]}
                  </Button>
                ))}
              </CardContent>
            </Card>

            {/* Overlay Controls */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Overlay Settings</CardTitle>
                <CardDescription className="text-slate-400">
                    Adjust overlay intensity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-sm text-slate-300">Intensity</label>
                    <span className="text-sm text-white">{overlayIntensity}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={overlayIntensity}
                    onChange={(e) => setOverlayIntensity(parseInt(e.target.value))}
                    className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    disabled={!showOverlay}
                  />
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  The overlay shows how different materials would look on the current surface. Adjust intensity to see more or less of the original surface.
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  onClick={() => window.location.href = "/estimator"}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Camera className="w-4 h-4 mr-2" />
                  Start New Estimate
                </Button>
                <Button
                  onClick={() => window.location.href = "/dashboard"}
                  variant="outline"
                  className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go to Dashboard
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Usage Tips */}
        <Card className="mt-6 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Tips for Live Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-slate-300">
              <li>• Hold your device steady for the best overlay accuracy</li>
              <li>• Use in good lighting conditions for realistic material appearance</li>
              <li>• Compare materials by switching between options in real-time</li>
              <li>• Adjust overlay intensity to see more or less of the original surface</li>
              <li>• This is a visualization tool - actual results may vary based on site conditions</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
