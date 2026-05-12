import {
  useState,
  useRef,
  useEffect,
  type ChangeEvent,
  type DragEvent,
  type PointerEvent,
} from "react";
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
import {
  chooseDrivewayPhotoFromGallery,
  isMediaSelectionCanceled,
  isNativeMobileApp,
  takeDrivewayPhotoWithCamera,
} from "@/lib/deviceMedia";
import { trpc } from "@/lib/trpc";
import {
  calculateSquareFeetFromCorners,
  type CornerPoint,
} from "@shared/geometry";
import { toast } from "sonner";
import { Loader2, Upload, Camera } from "lucide-react";
import { useLocation } from "wouter";

type Step = "upload" | "adjust" | "material" | "preview" | "summary";
type Material = "hotmix" | "millings" | "tar_and_chip" | "gravel";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});
const formatUsd = (value: number) => usdFormatter.format(value);

interface EstimatorState {
  photoUrl: string | null;
  photoKey: string | null;
  photoMimeType: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
  corners: CornerPoint[];
  squareFeet: number | null;
  depthInches: number;
  selectedMaterial: Material | null;
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
  const [, navigate] = useLocation();
  const [step, setStep] = useState<Step>("upload");
  const [state, setState] = useState<EstimatorState>({
    photoUrl: null,
    photoKey: null,
    photoMimeType: null,
    imageWidth: null,
    imageHeight: null,
    corners: [],
    squareFeet: null,
    depthInches: 2,
    selectedMaterial: null,
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
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [draggingCorner, setDraggingCorner] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
  const cornerPolygon = state.corners
    .map(corner => `${corner.x},${corner.y}`)
    .join(" ");
  const photoAspectRatio =
    state.imageWidth && state.imageHeight
      ? `${state.imageWidth} / ${state.imageHeight}`
      : "16 / 9";
  const nativeMobileApp = isNativeMobileApp();

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

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = event => {
        const result = event.target?.result;
        if (typeof result === "string") {
          resolve(result);
          return;
        }

        reject(new Error("Unable to read image file"));
      };
      reader.onerror = () => reject(new Error("Unable to read image file"));
      reader.readAsDataURL(file);
    });

  const loadImageDimensions = (dataUrl: string) =>
    new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.width, height: img.height });
      img.onerror = () => reject(new Error("Unable to load image"));
      img.src = dataUrl;
    });

  const handlePhotoCapture = async (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.has(file.type)) {
      toast.error("Upload a JPG, PNG, or WebP image");
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be 10 MB or smaller");
      return;
    }

    setLoading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const base64 = dataUrl.split(",")[1];
      if (!base64) throw new Error("Image file did not contain base64 data");

      const dimensions = await loadImageDimensions(dataUrl);
      const result = await uploadPhotoMutation.mutateAsync({
        photoBase64: base64,
        photoName: file.name,
        photoMimeType: file.type,
        imageWidth: dimensions.width,
        imageHeight: dimensions.height,
      });

      setState(prev => ({
        ...prev,
        photoUrl: result.photoUrl,
        photoKey: result.photoKey,
        photoMimeType: file.type,
        imageWidth: dimensions.width,
        imageHeight: dimensions.height,
        corners: result.corners,
        squareFeet:
          result.squareFeet ||
          calculateSquareFeetFromCorners(
            result.corners,
            dimensions.width,
            dimensions.height
          ),
      }));

      toast.success(`Driveway detected! ${result.squareFeet} sq ft`);
      setStep("adjust");
    } catch (error) {
      toast.error("Failed to process photo");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (file) void handlePhotoCapture(file);
  };

  const handleTakePhoto = async () => {
    if (!nativeMobileApp) {
      cameraInputRef.current?.click();
      return;
    }

    try {
      const file = await takeDrivewayPhotoWithCamera();
      if (file) await handlePhotoCapture(file);
    } catch (error) {
      if (isMediaSelectionCanceled(error)) return;
      toast.error("Camera access is required to take a driveway photo");
      console.error(error);
    }
  };

  const handleUploadPhoto = async () => {
    if (!nativeMobileApp) {
      fileInputRef.current?.click();
      return;
    }

    try {
      const file = await chooseDrivewayPhotoFromGallery();
      if (file) await handlePhotoCapture(file);
    } catch (error) {
      if (isMediaSelectionCanceled(error)) return;
      toast.error("Photo library access is required to upload an image");
      console.error(error);
    }
  };

  const handlePhotoDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDraggingOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void handlePhotoCapture(file);
  };

  const updateCornerFromPointer = (
    clientX: number,
    clientY: number,
    cornerIndex: number
  ) => {
    if (!containerRef.current || !state.photoUrl) return;
    const rect = containerRef.current.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setState(prev => {
      const newCorners = [...prev.corners];
      newCorners[cornerIndex] = {
        x: Math.max(0, Math.min(100, x)),
        y: Math.max(0, Math.min(100, y)),
      };

      const squareFeet =
        prev.imageWidth && prev.imageHeight
          ? calculateSquareFeetFromCorners(
              newCorners,
              prev.imageWidth,
              prev.imageHeight
            )
          : prev.squareFeet;

      return { ...prev, corners: newCorners, squareFeet };
    });
  };

  const handleCornerPointerDown = (
    event: PointerEvent<HTMLButtonElement>,
    index: number
  ) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggingCorner(index);
    updateCornerFromPointer(event.clientX, event.clientY, index);
  };

  const handleCornerPointerMove = (
    event: PointerEvent<HTMLButtonElement>,
    index: number
  ) => {
    if (draggingCorner !== index) return;
    event.preventDefault();
    updateCornerFromPointer(event.clientX, event.clientY, index);
  };

  const handleCornerPointerEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    setDraggingCorner(null);
  };

  const handleMaterialSelect = (material: Material) => {
    setState(prev => ({ ...prev, selectedMaterial: material }));
  };

  const handleGeneratePreview = async () => {
    if (!state.photoUrl || !state.selectedMaterial) return;

    setLoading(true);
    try {
      const result = await generatePreviewMutation.mutateAsync({
        photoUrl: state.photoUrl,
        photoMimeType: state.photoMimeType || "image/jpeg",
        material: state.selectedMaterial,
      });

      setState(prev => ({
        ...prev,
        previewUrl: result.previewUrl,
        previewKey: result.previewKey ?? null,
      }));

      toast.success(
        result.usedFallback
          ? "Preview service unavailable; showing original photo"
          : "Material preview generated!"
      );
      setStep("preview");
    } catch (error) {
      toast.error("Failed to generate preview");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProject = async () => {
    if (
      !state.photoUrl ||
      !state.photoKey ||
      !state.selectedMaterial ||
      !state.squareFeet
    ) {
      toast.error("Please complete all steps");
      return;
    }

    const projectName = state.projectName.trim();
    const contractorEmail = state.contractorEmail.trim();
    const notes = state.notes.trim();

    if (!projectName) {
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

      const result = await createProjectMutation.mutateAsync({
        projectName,
        photoUrl: state.photoUrl,
        photoKey: state.photoKey as string,
        squareFeet: state.squareFeet,
        depthInches: state.depthInches,
        cornerPoints: state.corners,
        selectedMaterial: state.selectedMaterial,
        zipCode: state.zipCode,
        latitude: state.latitude || undefined,
        longitude: state.longitude || undefined,
        previewImageUrl: state.previewUrl || undefined,
        previewImageKey: state.previewKey || undefined,
        contractorEmail: contractorEmail || undefined,
        notes: notes || undefined,
      });

      toast.success("Project saved successfully!");
      // Reset form
      setState({
        photoUrl: null,
        photoKey: null,
        photoMimeType: null,
        imageWidth: null,
        imageHeight: null,
        corners: [],
        squareFeet: null,
        depthInches: 2,
        selectedMaterial: null,
        previewUrl: null,
        previewKey: null,
        projectName: "",
        contractorEmail: "",
        notes: "",
        zipCode: state.zipCode,
        latitude: state.latitude,
        longitude: state.longitude,
      });
      navigate(
        result.projectId ? `/project/${result.projectId}` : "/dashboard"
      );
    } catch (error) {
      toast.error("Failed to save project");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const materials: Array<{ id: Material; name: string; icon: string }> = [
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
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition ${
                  isDraggingOver
                    ? "border-blue-400 bg-blue-500/10"
                    : "border-slate-600 hover:border-blue-500"
                }`}
                onDragEnter={event => {
                  event.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragOver={event => {
                  event.preventDefault();
                  setIsDraggingOver(true);
                }}
                onDragLeave={event => {
                  if (event.currentTarget === event.target) {
                    setIsDraggingOver(false);
                  }
                }}
                onDrop={handlePhotoDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  capture="environment"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
                <div className="flex w-full flex-col items-center gap-4">
                  {loading ? (
                    <>
                      <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                      <p className="text-slate-300">Processing photo...</p>
                    </>
                  ) : (
                    <>
                      {isDraggingOver ? (
                        <Upload className="w-12 h-12 text-blue-300" />
                      ) : (
                        <Camera className="w-12 h-12 text-slate-400" />
                      )}
                      <div>
                        <p className="text-white font-semibold">
                          {isDraggingOver
                            ? "Drop image to upload"
                            : "Take a photo or upload an image"}
                        </p>
                        <p className="text-slate-400 text-sm">
                          JPG, PNG, or WebP up to 10 MB
                        </p>
                      </div>
                    </>
                  )}
                  <div className="grid w-full max-w-md grid-cols-1 gap-3 sm:grid-cols-2">
                    <Button
                      type="button"
                      onClick={handleTakePhoto}
                      disabled={loading}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Camera className="h-4 w-4" />
                      Take Photo
                    </Button>
                    <Button
                      type="button"
                      onClick={handleUploadPhoto}
                      disabled={loading}
                      variant="outline"
                    >
                      <Upload className="h-4 w-4" />
                      Upload Image
                    </Button>
                  </div>
                </div>
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
                className="relative w-full touch-none overflow-hidden rounded-lg bg-black"
                style={{ aspectRatio: photoAspectRatio }}
              >
                <img
                  src={state.photoUrl}
                  alt="Driveway"
                  className="h-full w-full select-none object-cover"
                  draggable={false}
                />

                {state.corners.length >= 3 && (
                  <svg
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 h-full w-full"
                    preserveAspectRatio="none"
                    viewBox="0 0 100 100"
                  >
                    <polygon
                      points={cornerPolygon}
                      fill="rgba(37, 99, 235, 0.16)"
                      stroke="rgb(96, 165, 250)"
                      strokeWidth="0.75"
                      vectorEffect="non-scaling-stroke"
                    />
                  </svg>
                )}

                {/* Corner Markers */}
                {state.corners.map((corner, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Adjust driveway corner ${i + 1}`}
                    onPointerDown={event => handleCornerPointerDown(event, i)}
                    onPointerMove={event => handleCornerPointerMove(event, i)}
                    onPointerUp={handleCornerPointerEnd}
                    onPointerCancel={handleCornerPointerEnd}
                    onLostPointerCapture={() => setDraggingCorner(null)}
                    className="absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 touch-none rounded-full border-2 border-white bg-blue-500 shadow-lg shadow-black/30 outline-none ring-offset-2 ring-offset-slate-900 hover:bg-blue-600 focus-visible:ring-2 focus-visible:ring-blue-300"
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
                    onChange={e => {
                      const depth = Number(e.target.value);
                      setState(prev => ({
                        ...prev,
                        depthInches: Number.isFinite(depth)
                          ? Math.min(12, Math.max(1, Math.round(depth)))
                          : prev.depthInches,
                      }));
                    }}
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
                    type="button"
                    aria-pressed={state.selectedMaterial === material.id}
                    onClick={() => handleMaterialSelect(material.id)}
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
                    {state.selectedMaterial === material.id &&
                      getPricingQuery.data && (
                        <p className="text-blue-400 text-xs mt-2">
                          {formatUsd(getPricingQuery.data.pricePerSquareFoot)}
                          /sq ft
                        </p>
                      )}
                  </button>
                ))}
              </div>

              {state.selectedMaterial && getPricingQuery.isLoading && (
                <div className="flex items-center gap-2 rounded-md border border-slate-600 bg-slate-700/50 p-3 text-sm text-slate-200">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-300" />
                  Checking local material pricing...
                </div>
              )}

              {state.selectedMaterial && getPricingQuery.isError && (
                <div
                  role="alert"
                  className="rounded-md border border-red-500/40 bg-red-950/40 p-3 text-sm text-red-100"
                >
                  Pricing is unavailable for this ZIP code right now.
                </div>
              )}

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
                          {formatUsd(getPricingQuery.data.pricePerTon)}
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
                disabled={
                  !state.selectedMaterial ||
                  loading ||
                  getPricingQuery.isLoading ||
                  getPricingQuery.isError
                }
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {getPricingQuery.isLoading
                  ? "Checking Pricing..."
                  : loading
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
                disabled={
                  loading || !state.projectName.trim() || !getPricingQuery.data
                }
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
