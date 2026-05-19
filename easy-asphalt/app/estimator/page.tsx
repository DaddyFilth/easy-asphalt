"use client";

import { useState } from "react";
import Link from "next/link";

interface EstimateForm {
  projectName: string;
  squareFootage: number;
  depth: number;
  asphaltType: string;
  location: string;
}

export default function EstimatorPage() {
  const [form, setForm] = useState<EstimateForm>({
    projectName: "",
    squareFootage: 0,
    depth: 2,
    asphaltType: "hot-mix",
    location: "",
  });

  const [estimate, setEstimate] = useState<{
    tons: number;
    materialCost: number;
    laborCost: number;
    total: number;
  } | null>(null);

  const calculateEstimate = () => {
    if (form.squareFootage <= 0 || form.depth <= 0) {
      setEstimate(null);
      return;
    }

    const cubicFeet = form.squareFootage * (form.depth / 12);
    const tons = (cubicFeet * 145) / 2000;
    const materialCost = tons * 120;
    const laborCost = form.squareFootage * 2.5;
    const total = materialCost + laborCost;

    setEstimate({
      tons: Math.round(tons * 100) / 100,
      materialCost: Math.round(materialCost * 100) / 100,
      laborCost: Math.round(laborCost * 100) / 100,
      total: Math.round(total * 100) / 100,
    });
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-900 px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Paving Estimator
          </h1>
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Project Name
              </label>
              <input
                type="text"
                value={form.projectName}
                onChange={(e) => setForm({ ...form, projectName: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Main Street Resurfacing"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Location
              </label>
              <input
                type="text"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 123 Main St"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Square Footage
              </label>
              <input
                type="number"
                value={form.squareFootage || ""}
                onChange={(e) => setForm({ ...form, squareFootage: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 5000"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Depth (inches)
              </label>
              <input
                type="number"
                value={form.depth}
                onChange={(e) => setForm({ ...form, depth: Number(e.target.value) })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                min="1"
                max="12"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Asphalt Type
              </label>
              <select
                value={form.asphaltType}
                onChange={(e) => setForm({ ...form, asphaltType: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="hot-mix">Hot Mix Asphalt</option>
                <option value="warm-mix">Warm Mix Asphalt</option>
                <option value="porous">Porous Asphalt</option>
                <option value="recycled">Recycled Asphalt</option>
              </select>
            </div>
          </div>

          <button
            onClick={calculateEstimate}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Calculate Estimate
          </button>

          {estimate && (
            <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                Estimate Summary
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Material Needed</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{estimate.tons} tons</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Material Cost</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">${estimate.materialCost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Labor Cost</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">${estimate.laborCost.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Estimate</p>
                  <p className="text-3xl font-bold text-blue-600">${estimate.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
