"use client";

import { useState, useCallback } from "react";
import Camera, { type CapturedPhoto } from "./components/Camera";
import TodoSelector, { type TodoPhase } from "./components/TodoSelector";

// ── Initial TODO data sourced from the project's todo.md ──────────────────────
const INITIAL_PHASES: TodoPhase[] = [
  {
    id: "phase-1",
    title: "Phase 1: Database & Schema",
    items: [
      { id: "1-1", text: "Define projects table with user_id, photo_url, measurements, material, pricing", completed: true },
      { id: "1-2", text: "Define project_shares table for contractor sharing with unique tokens", completed: true },
      { id: "1-3", text: "Define material_prices table for caching regional pricing", completed: true },
      { id: "1-4", text: "Create Drizzle migrations and apply to database", completed: true },
    ],
  },
  {
    id: "phase-2",
    title: "Phase 2: Backend API",
    items: [
      { id: "2-1", text: "Create tRPC procedure for camera photo upload to S3", completed: true },
      { id: "2-2", text: "Create tRPC procedure for AI edge detection (LLM vision analysis)", completed: true },
      { id: "2-3", text: "Create tRPC procedure for local pricing lookup by ZIP code", completed: true },
      { id: "2-4", text: "Create tRPC procedure for material preview image generation", completed: true },
      { id: "2-5", text: "Create tRPC procedure for project CRUD (create, read, update, delete)", completed: true },
      { id: "2-6", text: "Create tRPC procedure for project share link generation", completed: true },
      { id: "2-7", text: "Create tRPC procedure for sending email notifications (owner + contractor)", completed: true },
      { id: "2-8", text: "Implement geolocation service to get user ZIP code", completed: true },
      { id: "2-9", text: "Implement email service integration (SendGrid or similar)", completed: true },
      { id: "2-10", text: "Write vitest tests for all backend procedures", completed: true },
    ],
  },
  {
    id: "phase-3",
    title: "Phase 3: Frontend — Camera & Measurement",
    items: [
      { id: "3-1", text: "Build camera capture component with device permissions", completed: true },
      { id: "3-2", text: "Build photo upload fallback for desktop testing", completed: true },
      { id: "3-3", text: "Build corner adjustment UI with draggable markers", completed: true },
      { id: "3-4", text: "Display AI-detected measurements (square feet)", completed: true },
      { id: "3-5", text: "Display manual depth input or LiDAR sensor reading", completed: true },
      { id: "3-6", text: "Build material selector grid (hotmix, millings, tar and chip, gravel)", completed: true },
      { id: "3-7", text: "Display material pricing and quantity needed", completed: true },
      { id: "3-8", text: "Create projects dashboard page", completed: true },
      { id: "3-9", text: "Add touch/pointer event support for mobile corner dragging", completed: false },
      { id: "3-10", text: "Recalculate square footage when corners are adjusted", completed: false },
      { id: "3-11", text: "Add permission denied/unavailable error handling for camera", completed: false },
    ],
  },
  {
    id: "phase-4",
    title: "Phase 4: Frontend — Visualization & Sharing",
    items: [
      { id: "4-1", text: "Build material preview canvas overlay (integrated in estimator)", completed: true },
      { id: "4-2", text: "Integrate AI image generation for photorealistic material render (via tRPC)", completed: true },
      { id: "4-3", text: "Build project dashboard with saved projects list", completed: true },
      { id: "4-4", text: "Build project detail view with all measurements and pricing", completed: true },
      { id: "4-5", text: "Build contractor share UI with email input and link generation", completed: true },
      { id: "4-6", text: "Build shareable project summary page (public view)", completed: true },
      { id: "4-7", text: "Build PDF export for project summary (jsPDF integration complete)", completed: true },
    ],
  },
  {
    id: "phase-5",
    title: "Phase 5: Integration & Testing",
    items: [
      { id: "5-1", text: "Implement PDF export functionality for project summaries", completed: true },
      { id: "5-2", text: "End-to-end test: capture → measure → select material → generate preview → save project", completed: true },
      { id: "5-3", text: "End-to-end test: share project → send email → verify contractor can access", completed: true },
      { id: "5-4", text: "Test geolocation and pricing accuracy (pricing service tests passing)", completed: true },
      { id: "5-5", text: "Test responsive design on mobile devices (mobile-first CSS implemented)", completed: true },
      { id: "5-6", text: "Performance optimization for image processing (S3 storage + lazy loading)", completed: true },
      { id: "5-7", text: "Error handling and user feedback for all flows (toast notifications + error boundaries)", completed: true },
    ],
  },
  {
    id: "phase-6",
    title: "Phase 6: Deployment & Polish",
    items: [
      { id: "6-1", text: "Create final checkpoint", completed: false },
      { id: "6-2", text: "Verify all features working in production", completed: false },
      { id: "6-3", text: "Document API endpoints and usage", completed: false },
      { id: "6-4", text: "Prepare for user delivery", completed: false },
    ],
  },
  {
    id: "phase-7",
    title: "Phase 7: Mobile Conversion & GitHub",
    items: [
      { id: "7-1", text: "Install and configure Capacitor", completed: true },
      { id: "7-2", text: "Configure iOS native app", completed: true },
      { id: "7-3", text: "Configure Android native app", completed: true },
      { id: "7-4", text: "Set up camera permissions for mobile (configured in native projects)", completed: true },
      { id: "7-5", text: "Test mobile app on iOS simulator", completed: false },
      { id: "7-6", text: "Test mobile app on Android emulator", completed: false },
      { id: "7-7", text: "Create GitHub repository", completed: true },
      { id: "7-8", text: "Push code to GitHub", completed: true },
      { id: "7-9", text: "Create build scripts for internal distribution", completed: true },
      { id: "7-10", text: "Document mobile setup and build instructions (MOBILE_BUILD.md created)", completed: true },
    ],
  },
];

export default function Home() {
  // ── Camera state ─────────────────────────────────────────────────────────────
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<CapturedPhoto | null>(null);

  const handleCapture = useCallback((photo: CapturedPhoto) => {
    setCapturedPhoto(photo);
    setShowCamera(false);
  }, []);

  // ── TODO state ───────────────────────────────────────────────────────────────
  const [phases, setPhases] = useState<TodoPhase[]>(INITIAL_PHASES);
  const [selectedPhaseId, setSelectedPhaseId] = useState<string | null>(null);

  const handleToggleItem = useCallback(
    (phaseId: string, itemId: string) => {
      setPhases((prev) =>
        prev.map((phase) =>
          phase.id !== phaseId
            ? phase
            : {
                ...phase,
                items: phase.items.map((item) =>
                  item.id !== itemId
                    ? item
                    : { ...item, completed: !item.completed }
                ),
              }
        )
      );
    },
    []
  );

  const handleSelectPhase = useCallback((phaseId: string) => {
    setSelectedPhaseId((prev) => (prev === phaseId ? null : phaseId));
  }, []);

  const selectedPhase = phases.find((p) => p.id === selectedPhaseId) ?? null;

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* ── Top nav ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/80">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛣️</span>
            <div>
              <h1 className="text-lg font-bold leading-tight text-zinc-900 dark:text-zinc-50">
                Easy Asphalt
              </h1>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Driveway Estimator Pro
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setCapturedPhoto(null);
              setShowCamera(true);
            }}
            className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 active:scale-95"
          >
            📸 New Photo
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ── LEFT: Camera section ────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Driveway Camera
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Capture a photo of your driveway to start an estimate.
              </p>
            </div>

            {showCamera ? (
              <Camera
                onCapture={handleCapture}
                onClose={() => setShowCamera(false)}
              />
            ) : capturedPhoto ? (
              <div className="flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                    ✅ Photo Captured
                  </h3>
                  <button
                    onClick={() => {
                      setCapturedPhoto(null);
                      setShowCamera(true);
                    }}
                    className="text-xs text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Retake
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-zinc-100 dark:border-zinc-800">
                  <img
                    src={capturedPhoto.dataUrl}
                    alt="Captured driveway"
                    className="w-full object-cover"
                    style={{ maxHeight: 320 }}
                  />
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                  <span>
                    📐 {capturedPhoto.width} × {capturedPhoto.height} px
                  </span>
                  <span>🖼 {capturedPhoto.mimeType}</span>
                </div>
                <button
                  onClick={() => setShowCamera(false)}
                  className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
                >
                  Proceed to Estimator →
                </button>
              </div>
            ) : (
              <div
                className="flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-zinc-300 bg-white p-10 text-center transition hover:border-blue-400 hover:bg-blue-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-blue-500 dark:hover:bg-blue-950/20"
                onClick={() => setShowCamera(true)}
              >
                <span className="text-5xl">📷</span>
                <div>
                  <p className="font-semibold text-zinc-700 dark:text-zinc-300">
                    Take or upload a driveway photo
                  </p>
                  <p className="mt-1 text-sm text-zinc-400">
                    Click to open the camera
                  </p>
                </div>
              </div>
            )}

            {/* Selected phase detail card */}
            {selectedPhase && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-800 dark:bg-blue-950/30">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold text-blue-800 dark:text-blue-300">
                    Selected Phase
                  </h3>
                  <button
                    onClick={() => setSelectedPhaseId(null)}
                    className="text-xs text-blue-500 hover:underline"
                  >
                    Deselect
                  </button>
                </div>
                <p className="mb-3 text-sm font-medium text-blue-900 dark:text-blue-200">
                  {selectedPhase.title}
                </p>
                <ul className="space-y-1">
                  {selectedPhase.items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start gap-2 text-sm"
                    >
                      <span className={item.completed ? "text-green-500" : "text-zinc-400"}>
                        {item.completed ? "✅" : "⬜"}
                      </span>
                      <span
                        className={
                          item.completed
                            ? "text-zinc-400 line-through dark:text-zinc-600"
                            : "text-zinc-700 dark:text-zinc-300"
                        }
                      >
                        {item.text}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          {/* ── RIGHT: TODO section ─────────────────────────────────────────── */}
          <section className="flex flex-col gap-4">
            <div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                Project TODO
              </h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Select a phase header to focus on it, or check off individual tasks.
              </p>
            </div>

            <TodoSelector
              phases={phases}
              onToggleItem={handleToggleItem}
              onSelectPhase={handleSelectPhase}
              selectedPhaseId={selectedPhaseId}
            />
          </section>
        </div>
      </main>
    </div>
  );
}
