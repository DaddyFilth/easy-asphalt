import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Upload, Camera, AlertCircle } from "lucide-react";

type Step = "upload" | "adjust" | "material" | "preview" | "summary";

interface CornerPoint {
  x: number;
  y: number;
}

interface EstimatorState {
  photoUrl: string | null;
  photoKey: string | null;
  corners: CornerPoint[];
  squareFeet: number | null;
  depthInches: number;
  selectedMaterial: "hotmix" | "millings" | "tar_and_chip" | "gravel" | null;
  pricing: any | null;
  previewUrl: string | null;
  previewKey: string | null;
  projectName: string;
  contractorEmail: string;
  notes: string;
  zipCode: string;
  latitude: string;
  longitude: string;
}

export default function Estimator() {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("upload");
  const [state, setState] = useState<EstimatorState>({
    photoUrl: null,
    photoKey: null,
    corners: [],
    squareFeet: null,
    depthInches: 2,
    selectedMaterial: null,
    pricing: null,
    previewUrl: null,
    previewKey: null,
    projectName: "",
    contractorEmail: "",
    notes: "",
    zipCode: "",
    latitude: "",
    longitude: "",
  });

  const [loading, setLoading] = useState(false);
  const [draggingCorner, setDraggingCorner] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const uploadPhotoMutation =
    trpc.projects.uploadPhotoAndDetectEdges.useMutation();
  const getPricingQuery = trpc.projects.getPricing.useQuery(
    {
      zipCode: state.zipCode,
      material: state.selectedMaterial || "hotmix",
      squareFeet: state.squareFeet || 1000,
      depthInches: state.depthInches,
    },
    {
      enabled:
        !!state.zipCode && !!state.selectedMaterial && !!state.squareFeet,
    }
  );
  const generatePreviewMutation =
    trpc.projects.generateMaterialPreview.useMutation();
  const createProjectMutation = trpc.projects.create.useMutation();

  // Get user's geolocation on mount
  useEffect(() => {
    if (!user) return;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          setState(prev => ({
            ...prev,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          }));
          // In production, reverse geocode to get ZIP code
          // For now, use a default
          setState(prev => ({ ...prev, zipCode: "10001" }));
        },
        error => {
          console.warn("Geolocation error:", error);
          setState(prev => ({ ...prev, zipCode: "10001" })); // Default ZIP
        }
      );
    }
  }, [user]);

  const handlePhotoCapture = async (file: File) => {
    if (!file) return;

    setLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async e => {
        const base64 = (e.target?.result as string).split(",")[1];
        if (!base64) return;

        // Get image dimensions
        const img = new Image();
        img.onload = async () => {
          try {
            const result = await uploadPhotoMutation.mutateAsync({
              photoBase64: base64,
              photoName: file.name,
              imageWidth: img.width,
              imageHeight: img.height,
            });

            setState(prev => ({
              ...prev,
              photoUrl: result.photoUrl,
              photoKey: result.photoKey,
              corners: result.corners,
              squareFeet: result.squareFeet,
            }));

            toast.success(`Driveway detected! ${result.squareFeet} sq ft`);
            setStep("adjust");
          } catch (error) {
            toast.error("Failed to detect driveway edges");
            console.error(error);
          } finally {
            setLoading(false);
          }
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to process photo");
      setLoading(false);
    }
  };

  const handleCornerDragStart = (index: number) => {
    setDraggingCorner(index);
  };

  const handleCornerDrag = (e: React.MouseEvent) => {
    if (draggingCorner === null || !containerRef.current || !state.photoUrl)
      return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setState(prev => {
      const newCorners = [...prev.corners];
      newCorners[draggingCorner] = {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };
      return { ...prev, corners: newCorners };
    });
  };

  const handleCornerDragEnd = () => {
    setDraggingCorner(null);
  };

  const handleMaterialSelect = (
    material: "hotmix" | "millings" | "tar_and_chip" | "gravel"
  ) => {
    setState(prev => ({ ...prev, selectedMaterial: material }));
  };

  const handleGeneratePreview = async () => {
    if (!state.photoUrl || !state.selectedMaterial) return;

    setLoading(true);
    try {
      const result = await generatePreviewMutation.mutateAsync({
        photoUrl: state.photoUrl,
        material: state.selectedMaterial,
      });

      setState(prev => ({
        ...prev,
        previewUrl: result.previewUrl,
        previewKey: result.previewKey,
      }));

      toast.success("Material preview generated!");
      setStep("preview");
    } catch (error) {
      toast.error("Failed to generate preview");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (!state.photoUrl || !state.selectedMaterial || !state.squareFeet) {
      toast.error("Please complete all steps");
      return;
    }

    if (!state.projectName) {
      toast.error("Please enter a project name");
      return;
    }

    setLoading(true);
    try {
      const pricing = getPricingQuery.data;
      if (!pricing) {
        toast.error("Pricing not available");
        return;
      }

      await createProjectMutation.mutateAsync({
        projectName: state.projectName,
        photoUrl: state.photoUrl,
        photoKey: state.photoKey as string,
        squareFeet: state.squareFeet,
        depthInches: state.depthInches,
        cornerPoints: state.corners,
        selectedMaterial: state.selectedMaterial,
        quantityNeeded: pricing.quantityNeeded,
        pricePerUnit: pricing.pricePerTon,
        totalCost: pricing.totalCost,
        zipCode: state.zipCode,
        latitude: state.latitude,
        longitude: state.longitude,
        previewImageUrl: state.previewUrl || undefined,
        previewImageKey: state.previewKey || undefined,
        contractorEmail: state.contractorEmail || undefined,
        notes: state.notes || undefined,
      });

      toast.success("Project saved successfully!");
      // Reset form
      setState({
        photoUrl: null,
        photoKey: null,
        corners: [],
        squareFeet: null,
        depthInches: 2,
        selectedMaterial: null,
        pricing: null,
        previewUrl: null,
        previewKey: null,
        projectName: "",
        contractorEmail: "",
        notes: "",
        zipCode: state.zipCode,
        latitude: state.latitude,
        longitude: state.longitude,
      });
      setStep("upload");
    } catch (error) {
      toast.error("Failed to save project");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const materials = [
    { id: "hotmix", name: "Hot Mix Asphalt", icon: "🛣️" },
    { id: "millings", name: "Asphalt Millings", icon: "♻️" },
    { id: "tar_and_chip", name: "Tar & Chip", icon: "🪨" },
    { id: "gravel", name: "Gravel", icon: "⚫" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Driveway Estimator Pro
          </h1>
          <p className="text-slate-300">
            Measure, visualize, and estimate your driveway project
          </p>
        </div>

        {/* Step Indicator */}
        <div className="flex justify-between mb-8">
          {["upload", "adjust", "material", "preview", "summary"].map(
            (s, i) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    step === s
                      ? "bg-blue-500 text-white"
                      : [
                            "upload",
                            "adjust",
                            "material",
                            "preview",
                            "summary",
                          ].indexOf(step) > i
                        ? "bg-green-500 text-white"
                        : "bg-slate-600 text-slate-300"
                  }`}
                >
                  {i + 1}
                </div>
                {i < 4 && <div className="w-12 h-1 bg-slate-600 mx-2"></div>}
              </div>
            )
          )}
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                Step 1: Capture Your Driveway
              </CardTitle>
              <CardDescription>
                Take a photo or upload an image of your driveway
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-blue-500 transition">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={e =>
                    e.target.files?.[0] && handlePhotoCapture(e.target.files[0])
                  }
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex flex-col items-center gap-4 w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                      <p className="text-slate-300">Processing photo...</p>
                    </>
                  ) : (
                    <>
                      <Camera className="w-12 h-12 text-slate-400" />
                      <div>
                        <p className="text-white font-semibold">
                          Click to capture or upload
                        </p>
                        <p className="text-slate-400 text-sm">
                          or drag and drop an image
                        </p>
                      </div>
                    </>
                  )}
                </button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Adjust Corners Step */}
        {step === "adjust" && state.photoUrl && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                Step 2: Adjust Driveway Corners
              </CardTitle>
              <CardDescription>
                Drag the corners to match your driveway edges
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                ref={containerRef}
                className="relative w-full bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: "16/9" }}
                onMouseMove={handleCornerDrag}
                onMouseUp={handleCornerDragEnd}
                onMouseLeave={handleCornerDragEnd}
              >
                <img
                  src={state.photoUrl}
                  alt="Driveway"
                  className="w-full h-full object-cover"
                />

                {/* Corner Markers */}
                {state.corners.map((corner, i) => (
                  <div
                    key={i}
                    onMouseDown={() => handleCornerDragStart(i)}
                    className="absolute w-8 h-8 bg-blue-500 border-2 border-white rounded-full cursor-move transform -translate-x-1/2 -translate-y-1/2 hover:bg-blue-600"
                    style={{ left: `${corner.x}%`, top: `${corner.y}%` }}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Detected Area</Label>
                  <p className="text-2xl font-bold text-white">
                    {state.squareFeet} sq ft
                  </p>
                </div>
                <div>
                  <Label className="text-slate-300">Depth</Label>
                  <Input
                    type="number"
                    min="1"
                    max="12"
                    value={state.depthInches}
                    onChange={e =>
                      setState(prev => ({
                        ...prev,
                        depthInches: parseInt(e.target.value),
                      }))
                    }
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                  <p className="text-xs text-slate-400">inches</p>
                </div>
              </div>

              <Button
                onClick={() => setStep("material")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue to Materials
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Material Selection Step */}
        {step === "material" && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                Step 3: Select Material
              </CardTitle>
              <CardDescription>
                Choose the driveway material you want
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {materials.map(material => (
                  <button
                    key={material.id}
                    onClick={() => handleMaterialSelect(material.id as any)}
                    className={`p-4 rounded-lg border-2 transition ${
                      state.selectedMaterial === material.id
                        ? "border-blue-500 bg-blue-500/10"
                        : "border-slate-600 bg-slate-700/50 hover:border-slate-500"
                    }`}
                  >
                    <div className="text-3xl mb-2">{material.icon}</div>
                    <p className="text-white font-semibold text-sm">
                      {material.name}
                    </p>
                    {getPricingQuery.data && (
                      <p className="text-blue-400 text-xs mt-2">
                        {getPricingQuery.data.pricePerSquareFoot}/sq ft
                      </p>
                    )}
                  </button>
                ))}
              </div>

              {getPricingQuery.data && state.selectedMaterial && (
                <Card className="bg-slate-700 border-slate-600">
                  <CardContent className="pt-6">
                    <div className="space-y-2 text-white">
                      <div className="flex justify-between">
                        <span>Quantity Needed:</span>
                        <span className="font-bold">
                          {getPricingQuery.data.quantityNeeded}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Price per Ton:</span>
                        <span className="font-bold">
                          {getPricingQuery.data.pricePerTon}
                        </span>
                      </div>
                      <div className="flex justify-between text-lg border-t border-slate-600 pt-2 mt-2">
                        <span>Total Cost:</span>
                        <span className="font-bold text-green-400">
                          {getPricingQuery.data.totalCost}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleGeneratePreview}
                disabled={!state.selectedMaterial || loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading
                  ? "Generating Preview..."
                  : "Generate Material Preview"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Preview Step */}
        {step === "preview" && state.previewUrl && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                Step 4: Preview Your Driveway
              </CardTitle>
              <CardDescription>
                See how your driveway will look with the selected material
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                className="relative w-full bg-black rounded-lg overflow-hidden"
                style={{ aspectRatio: "16/9" }}
              >
                <img
                  src={state.previewUrl}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <Button
                onClick={() => setStep("summary")}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue to Summary
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Summary Step */}
        {step === "summary" && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">
                Step 5: Project Summary
              </CardTitle>
              <CardDescription>
                Review and save your driveway estimate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-slate-300">Project Name</Label>
                  <Input
                    value={state.projectName}
                    onChange={e =>
                      setState(prev => ({
                        ...prev,
                        projectName: e.target.value,
                      }))
                    }
                    placeholder="e.g., Front Driveway Renovation"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">
                    Contractor Email (Optional)
                  </Label>
                  <Input
                    type="email"
                    value={state.contractorEmail}
                    onChange={e =>
                      setState(prev => ({
                        ...prev,
                        contractorEmail: e.target.value,
                      }))
                    }
                    placeholder="contractor@example.com"
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>

                <div>
                  <Label className="text-slate-300">Notes (Optional)</Label>
                  <Textarea
                    value={state.notes}
                    onChange={e =>
                      setState(prev => ({ ...prev, notes: e.target.value }))
                    }
                    placeholder="Any additional details..."
                    className="bg-slate-700 border-slate-600 text-white"
                    rows={3}
                  />
                </div>
              </div>

              <Card className="bg-slate-700 border-slate-600">
                <CardContent className="pt-6">
                  <div className="space-y-2 text-white">
                    <div className="flex justify-between">
                      <span>Area:</span>
                      <span className="font-bold">
                        {state.squareFeet} sq ft
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Material:</span>
                      <span className="font-bold">
                        {
                          materials.find(m => m.id === state.selectedMaterial)
                            ?.name
                        }
                      </span>
                    </div>
                    {getPricingQuery.data && (
                      <>
                        <div className="flex justify-between">
                          <span>Quantity:</span>
                          <span className="font-bold">
                            {getPricingQuery.data.quantityNeeded}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg border-t border-slate-600 pt-2 mt-2">
                          <span>Total Cost:</span>
                          <span className="font-bold text-green-400">
                            {getPricingQuery.data.totalCost}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleSaveProject}
                disabled={loading || !state.projectName}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                {loading ? "Saving..." : "Save Project"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
