import { useSearchParams } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
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
import { ArrowLeft, Trophy, Loader2, Crown } from "lucide-react";
import { useMemo } from "react";

export default function Compare() {
  const [params] = useSearchParams();
  const { user } = useAuth();
  
  const projectIds = useMemo(() => {
    const ids = params.getAll("id");
    return ids.map(id => parseInt(id)).filter(id => !isNaN(id));
  }, [params]);

  const projectsQuery = trpc.projects.list.useQuery(undefined, {
    enabled: !!user
  });

  const selectedProjects = useMemo(() => {
    if (!projectsQuery.data) return [];
    return projectsQuery.data.filter(project => 
      projectIds.includes(project.id)
    );
  }, [projectsQuery.data, projectIds]);

  const bestValueProject = useMemo(() => {
    if (selectedProjects.length === 0) return null;
    
    return selectedProjects.reduce((best, current) => {
      const bestCost = parseFloat(best.finalInvoiceTotal || best.totalCost || "0");
      const currentCost = parseFloat(current.finalInvoiceTotal || current.totalCost || "0");
      return currentCost < bestCost ? current : best;
    });
  }, [selectedProjects]);

  if (projectsQuery.isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (selectedProjects.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Button
            onClick={() => window.location.href = "/dashboard"}
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-slate-400 mb-4">No projects selected for comparison</p>
              <p className="text-slate-500 text-sm mb-6">
                Please select 2-4 projects from the dashboard to compare
              </p>
              <Button
                onClick={() => window.location.href = "/dashboard"}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const materials: Record<string, { name: string; icon: string }> = {
    hotmix: { name: "Hot Mix Asphalt", icon: "🛣️" },
    millings: { name: "Asphalt Millings", icon: "♻️" },
    tar_and_chip: { name: "Tar & Chip", icon: "🪨" },
    gravel: { name: "Gravel", icon: "⚫" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Button
              onClick={() => window.location.href = "/dashboard"}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700 mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
              Compare Projects
            </h1>
            <p className="text-slate-300">
              Comparing {selectedProjects.length} project{selectedProjects.length !== 1 ? "s" : ""}
            </p>
          </div>
          {bestValueProject && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/30 px-4 py-2 rounded-lg">
              <Trophy className="w-5 h-5 text-emerald-400" />
              <span className="text-emerald-300 font-medium">Best Value Highlighted</span>
            </div>
          )}
        </div>

        {/* Comparison Grid */}
        <div className={`grid grid-cols-1 gap-6 ${selectedProjects.length === 2 ? "md:grid-cols-2" : selectedProjects.length === 3 ? "lg:grid-cols-3" : "xl:grid-cols-4"}`}>
          {selectedProjects.map(project => {
            const isBestValue = bestValueProject?.id === project.id;
            const materialInfo = project.selectedMaterial
              ? materials[project.selectedMaterial]
              : null;
            const totalCost = parseFloat(project.finalInvoiceTotal || project.totalCost || "0");
            const hasLaborQuote =
              !!project.contractorPricePerSquareFoot && !!project.laborCost;
            const additionalCosts = Array.isArray(project.additionalCosts)
              ? project.additionalCosts
              : [];

            return (
              <Card
                key={project.id}
                className={`bg-slate-800 border-slate-700 overflow-hidden ${
                  isBestValue ? "border-emerald-500 ring-2 ring-emerald-500/30" : ""
                }`}
              >
                {isBestValue && (
                  <div className="bg-emerald-500 px-4 py-2 flex items-center justify-center gap-2">
                    <Crown className="w-4 h-4 text-white" />
                    <span className="text-white font-semibold text-sm">Best Value</span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-white text-lg">
                    {project.projectName}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Project Thumbnail */}
                  {project.previewImageUrl && (
                    <div className="relative w-full h-32 bg-black rounded-lg overflow-hidden">
                      <img
                        src={project.previewImageUrl}
                        alt={project.projectName ?? "Project preview"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {!project.previewImageUrl && project.photoUrl && (
                    <div className="relative w-full h-32 bg-black rounded-lg overflow-hidden">
                      <img
                        src={project.photoUrl}
                        alt={project.projectName ?? "Project photo"}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Material Info */}
                  <div className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg">
                    <div className="text-3xl">{materialInfo?.icon || "❓"}</div>
                    <div>
                      <p className="text-white font-semibold">
                        {materialInfo?.name || "Unknown"}
                      </p>
                      <p className="text-slate-400 text-sm">
                        {project.selectedMaterial}
                      </p>
                    </div>
                  </div>

                  {/* Measurements */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Area:</span>
                      <span className="text-white font-semibold">
                        {project.squareFeet} sq ft
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Depth:</span>
                      <span className="text-white font-semibold">
                        {project.depthInches} in
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Location:</span>
                      <span className="text-white font-semibold">
                        {project.zipCode}
                      </span>
                    </div>
                  </div>

                  {/* Pricing */}
                  <div className="space-y-2 text-sm border-t border-slate-700 pt-3">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Price/Unit:</span>
                      <span className="text-white font-semibold">
                        {project.pricePerUnit}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Material Cost:</span>
                      <span className="text-blue-300 font-semibold">
                        {project.materialCost || project.totalCost}
                      </span>
                    </div>
                    {hasLaborQuote && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Contractor Rate:</span>
                          <span className="text-white font-semibold">
                            {project.contractorPricePerSquareFoot}/sq ft
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Labor Cost:</span>
                          <span className="text-amber-300 font-semibold">
                            {project.laborCost}
                          </span>
                        </div>
                      </>
                    )}
                    {additionalCosts.length > 0 && (
                      <div className="flex flex-col gap-1 pt-2">
                        <span className="text-slate-400 text-xs">Add-ons:</span>
                        {additionalCosts.slice(0, 2).map((item: any, index: number) => (
                          <div
                            key={`${item.label}-${index}`}
                            className="flex justify-between text-xs text-slate-300"
                          >
                            <span>{item.label}</span>
                            <span>${Number(item.amount).toFixed(2)}</span>
                          </div>
                        ))}
                        {additionalCosts.length > 2 && (
                          <span className="text-xs text-slate-400">
                            +{additionalCosts.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Total Cost */}
                  <div className="pt-3 border-t border-slate-700">
                    <p className="text-slate-400 text-xs mb-1">
                      {hasLaborQuote ? "Total Cost" : "Material-Only Total"}
                    </p>
                    <p className={`text-2xl font-bold ${isBestValue ? "text-emerald-400" : "text-green-400"}`}>
                      ${totalCost.toFixed(2)}
                    </p>
                    {isBestValue && (
                      <Badge className="mt-2 bg-emerald-500/20 text-emerald-300 border-emerald-500/30">
                        Lowest Price
                      </Badge>
                    )}
                  </div>

                  {/* View Button */}
                  <Button
                    asChild
                    variant="outline"
                    className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                  >
                    <a href={`/project/${project.id}`}>
                      View Details
                    </a>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Comparison Summary */}
        <Card className="mt-8 bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Quick Comparison Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Project</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium">Material</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Area</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Total Cost</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium">Cost/sq ft</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedProjects.map(project => {
                    const isBestValue = bestValueProject?.id === project.id;
                    const totalCost = parseFloat(project.finalInvoiceTotal || project.totalCost || "0");
                    const costPerSqFt = project.squareFeet && project.squareFeet > 0
                      ? totalCost / project.squareFeet
                      : 0;
                    const materialInfo = project.selectedMaterial
                      ? materials[project.selectedMaterial]
                      : null;

                    return (
                      <tr
                        key={project.id}
                        className={`border-b border-slate-700/50 ${
                          isBestValue ? "bg-emerald-500/5" : ""
                        }`}
                      >
                        <td className={`py-3 px-4 ${isBestValue ? "text-emerald-300 font-semibold" : "text-white"}`}>
                          {project.projectName}
                          {isBestValue && <Crown className="inline w-3 h-3 ml-1 text-emerald-400" />}
                        </td>
                        <td className="py-3 px-4 text-slate-300">
                          {materialInfo?.icon} {materialInfo?.name || "Unknown"}
                        </td>
                        <td className="py-3 px-4 text-right text-white">
                          {project.squareFeet ?? "N/A"}
                        </td>
                        <td className={`py-3 px-4 text-right ${isBestValue ? "text-emerald-300 font-semibold" : "text-green-300"}`}>
                          ${totalCost.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right text-white">
                          {project.squareFeet ? `$${costPerSqFt.toFixed(2)}` : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
