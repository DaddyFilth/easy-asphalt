import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";
import { Trash2, Share2, Eye, Loader2 } from "lucide-react";

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedProject, setSelectedProject] = useState<number | null>(null);

  const projectsQuery = trpc.projects.list.useQuery();
  const deleteProjectMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      projectsQuery.refetch();
      toast.success("Project deleted");
    },
  });
  const createShareLinkMutation = trpc.projects.createShareLink.useMutation({
    onSuccess: data => {
      toast.success("Share link created! Copied to clipboard.");
      navigator.clipboard.writeText(data.shareLink);
    },
  });

  const handleDelete = (projectId: number) => {
    if (confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate({ projectId });
    }
  };

  const handleShare = (projectId: number) => {
    createShareLinkMutation.mutate({ projectId });
  };

  const materials: Record<string, { name: string; icon: string }> = {
    hotmix: { name: "Hot Mix Asphalt", icon: "🛣️" },
    millings: { name: "Asphalt Millings", icon: "♻️" },
    tar_and_chip: { name: "Tar & Chip", icon: "🪨" },
    gravel: { name: "Gravel", icon: "⚫" },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">My Projects</h1>
            <p className="text-slate-300">
              Manage your driveway estimates and share with contractors
            </p>
          </div>
          <Link href="/estimator">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              New Estimate
            </Button>
          </Link>
        </div>

        {/* Projects Grid */}
        {projectsQuery.isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        ) : !projectsQuery.data || projectsQuery.data.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="pt-12 pb-12 text-center">
              <p className="text-slate-400 mb-4">
                No projects yet. Create your first driveway estimate!
              </p>
              <Link href="/estimator">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Start Estimating
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectsQuery.data.map(project => (
              <Card
                key={project.id}
                className="bg-slate-800 border-slate-700 hover:border-blue-500 transition"
              >
                <CardHeader>
                  <CardTitle className="text-white">
                    {project.projectName}
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    {new Date(project.createdAt).toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Project Thumbnail */}
                  {project.previewImageUrl && (
                    <div className="relative w-full h-40 bg-black rounded-lg overflow-hidden">
                      {/* @ts-ignore */}
                      <img
                        src={project.previewImageUrl}
                        alt={project.projectName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  {!project.previewImageUrl && project.photoUrl && (
                    <div className="relative w-full h-40 bg-black rounded-lg overflow-hidden">
                      {/* @ts-ignore */}
                      <img
                        src={project.photoUrl}
                        alt={project.projectName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Project Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Area:</span>
                      <span className="text-white font-semibold">
                        {project.squareFeet} sq ft
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Material:</span>
                      <span className="text-white font-semibold">
                        {project.selectedMaterial &&
                        materials[project.selectedMaterial]
                          ? materials[project.selectedMaterial].name
                          : "Unknown"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cost:</span>
                      <span className="text-green-400 font-semibold">
                        {project.totalCost}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-700">
                    <Link href={`/project/${project.id}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      onClick={() => handleShare(project.id)}
                      disabled={createShareLinkMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="w-full border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleDelete(project.id)}
                      disabled={deleteProjectMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="w-full border-red-600 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
