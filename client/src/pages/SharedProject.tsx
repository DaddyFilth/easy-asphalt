import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

  const handleDownloadPDF = () => {
    if (!projectQuery.data) return;
    // In production, generate PDF with project details
    alert("PDF download feature coming soon");
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
              <p className="text-slate-400 mb-4">Project not found or link has expired</p>
              <p className="text-slate-500 text-sm">Please check the link and try again</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const project = projectQuery.data;
  const materialInfo = project.selectedMaterial ? materials[project.selectedMaterial] : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">{project.projectName}</h1>
          <p className="text-slate-300">Driveway Estimate Summary</p>
        </div>

        {/* Project Images */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {project.photoUrl && (
            <Card className="bg-slate-800 border-slate-700 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-white">Original Photo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img src={project.photoUrl} alt="Original" className="w-full h-full object-cover" />
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
                <div className="relative w-full bg-black rounded-lg overflow-hidden" style={{ aspectRatio: "16/9" }}>
                  <img src={project.previewImageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Project Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Measurements */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Measurements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Area:</span>
                  <span className="text-white font-semibold">{project.squareFeet} sq ft</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Depth:</span>
                  <span className="text-white font-semibold">{project.depthInches} inches</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Location:</span>
                  <span className="text-white font-semibold">{project.zipCode}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Material & Pricing */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Material & Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-400">Material:</span>
                  <span className="text-white font-semibold flex items-center gap-2">
                    {materialInfo && <span>{materialInfo.icon}</span>}
                    {materialInfo?.name || "Unknown"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quantity:</span>
                  <span className="text-white font-semibold">{project.quantityNeeded}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Price per Unit:</span>
                  <span className="text-white font-semibold">{project.pricePerUnit}</span>
                </div>
                <div className="flex justify-between text-lg border-t border-slate-600 pt-3 mt-3">
                  <span className="text-slate-300">Total Cost:</span>
                  <span className="text-green-400 font-bold">{project.totalCost}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Notes */}
        {project.notes && (
          <Card className="bg-slate-800 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-300">{project.notes}</p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          <Button onClick={handleDownloadPDF} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
            <Download className="w-4 h-4 mr-2" />
            Download PDF
          </Button>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-slate-500 text-sm">
          <p>This project was shared via Driveway Estimator Pro</p>
          <p>Created on {new Date(project.createdAt).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  );
}
