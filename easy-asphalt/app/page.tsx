"use client";

import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <div className="max-w-2xl w-full text-center space-y-8">
        <h1 className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white">
          Asphalt Paving Estimator
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Professional paving project management and cost estimation tools for contractors.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/estimator"
            className="px-6 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-900 dark:text-white font-semibold rounded-lg transition-colors"
          >
            New Estimate
          </Link>
        </div>
      </div>
    </main>
  );
}
