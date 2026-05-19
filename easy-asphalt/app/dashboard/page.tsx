"use client";

import Link from "next/link";
import { Plus, Eye, Trash2, Share2 } from "lucide-react";

export default function DashboardPage() {
  const projects = [
    {
      id: "1",
      name: "Main Street Resurfacing",
      client: "ABC Construction",
      status: "In Progress",
      totalCost: 18500,
      date: "2026-05-15",
    },
    {
      id: "2",
      name: "Residential Driveway",
      client: "John Doe",
      status: "Completed",
      totalCost: 4200,
      date: "2026-05-10",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
              Project Dashboard
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage your paving estimates and projects
            </p>
          </div>
          <Link
            href="/estimator"
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Estimate
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {project.name}
                  </h3>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    project.status === "Completed" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="space-y-2 mb-6">
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Client: <span className="text-slate-700 dark:text-slate-200">{project.client}</span>
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Date: <span className="text-slate-700 dark:text-slate-200">{project.date}</span>
                  </p>
                  <p className="text-lg font-bold text-blue-600">
                    ${project.totalCost.toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-slate-700">
                  <Link
                    href={`/projects/${project.id}`}
                    className="flex-1 inline-flex justify-center items-center px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium rounded-lg transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Link>
                  <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
