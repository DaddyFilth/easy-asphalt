import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Download } from "lucide-react";

export default function SharedProject() {
  const { shareToken } = useParams<{ shareToken: string }>();

  const projectQuery = trpc.projects.getSharedProject.useQuery(
    { shareToken: shareToken || "" },
    { enabled: !!shareToken }
  );

  const materials: Record<string, { name: string; icon: string }> = {
    hotmix: { name: "Hot Mix Asphalt", icon: "🛣️" },
    millings: { name: "Asphalt Millings", icon: "♻️" },
    tar_and_chip: { name: "Tar & Chip", icon: "🪨" },
    gravel: { name: "Gravel", icon: "⚫" },
  };

  const handleDownloadPDF = async () => {
    if (!projectQuery.data) return;
    const project = projectQuery.data;

    try {
      const { jsPDF } = await import("jspdf");
      const doc = new jsPDF();
      const margin = 15;
      let yPosition = margin;

      doc.setFontSize(24);
      doc.setTextColor(40, 40, 40);
      doc.text("Driveway Estimate", margin, yPosition);

      yPosition += 12;
      doc.setFontSize(14);
      doc.setTextColor(80, 80, 80);
      doc.text(project.projectName || "Project", margin, yPosition);

      yPosition += 15;

      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Measurements", margin, yPosition);

      yPosition += 8;
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Area: ${project.squareFeet} sq ft`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Depth: ${project.depthInches} inches`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Location: ${project.zipCode}`, margin + 5, yPosition);

      yPosition += 12;

      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Material", margin, yPosition);

      yPosition += 8;
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      const materialName =
        materials[project.selectedMaterial || ""]?.name ||
        project.selectedMaterial ||
        "Unknown";
      doc.text(`Type: ${materialName}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(`Quantity: ${project.quantityNeeded}`, margin + 5, yPosition);
      yPosition += 6;
      doc.text(
        `Price per Unit: ${project.pricePerUnit}`,
        margin + 5,
        yPosition
      );

      yPosition += 10;

      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text("Pricing", margin, yPosition);

      yPosition += 8;
      doc.setFontSize(11);
      doc.setTextColor(0, 128, 0);
      doc.text(`Total Cost: ${project.totalCost}`, margin + 5, yPosition);

      const filename = `driveway-estimate-${project.projectName?.replace(/\s+/g, "-")}-${Date.now()}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error("PDF generation failed:", error);
      alert("Failed to generate PDF");
    }
  };

  if (projectQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!projectQuery.data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-slate-400 mb-4">
                Project not found or link has expired
              </p>
              <p className="text-slate-500 text-sm">
                Please check the link and try again
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const project = projectQuery.data;
  const materialInfo = project.selectedMaterial
    ? materials[project.selectedMaterial]
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {project.projectName}
            </h1>
            <p className="text-slate-300">Driveway Estimate Summary</p>
          </div>
          <Button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Project Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {project.photoUrl && (
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-white">Original Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="relative w-full bg-black rounded-lg overflow-hidden"
                  style={{ aspectRatio: "16/9" }}
                >
                  <img
                    src={project.photoUrl}
                    alt="Original"
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {project.previewImageUrl && (
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-white">Material Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="relative w-full bg-black rounded-lg overflow-hidden"
                  style={{ aspectRatio: "16/9" }}
                >
                  <img
                    src={project.previewImageUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Measurements */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Measurements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Area</p>
                <p className="text-2xl font-bold text-white">
                  {project.squareFeet} sq ft
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Depth</p>
                <p className="text-lg font-semibold text-white">
                  {project.depthInches} inches
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Location</p>
                <p className="text-lg font-semibold text-white">
                  {project.zipCode}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Material */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Material</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-4xl mb-2">{materialInfo?.icon}</div>
              <div>
                <p className="text-slate-400 text-sm">Type</p>
                <p className="text-lg font-semibold text-white">
                  {materialInfo?.name}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Quantity</p>
                <p className="text-lg font-semibold text-white">
                  {project.quantityNeeded}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-slate-400 text-sm">Price per Unit</p>
                <p className="text-lg font-semibold text-white">
                  {project.pricePerUnit}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Cost</p>
                <p className="text-3xl font-bold text-green-400">
                  {project.totalCost}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {project.notes && (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">{project.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>This project was shared via Driveway Estimator Pro</p>
          <p>Created on {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
