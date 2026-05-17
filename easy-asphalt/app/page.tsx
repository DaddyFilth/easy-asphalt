'use client';

import { useState } from 'react';
import ImageUploadPanel from './components/ImageUploadPanel';
import TodoSelector, { type TodoPhase } from './components/TodoSelector';

const INITIAL_PHASES: TodoPhase[] = [
  {
    id: 'phase-1',
    title: 'Phase 1: Database & Schema',
    items: [
      { id: '1-1', text: 'Define projects table with user_id, photo_url, measurements, material, pricing', completed: true },
      { id: '1-2', text: 'Define project_shares table for contractor sharing with unique tokens', completed: true },
      { id: '1-3', text: 'Define material_prices table for caching regional pricing', completed: true },
      { id: '1-4', text: 'Create Drizzle migrations and apply to database', completed: true },
    ],
  },
  {
    id: 'phase-2',
    title: 'Phase 2: Backend API',
    items: [
      { id: '2-1', text: 'Create tRPC procedure for camera photo upload to S3', completed: true },
      { id: '2-2', text: 'Create tRPC procedure for AI edge detection (LLM vision analysis)', completed: true },
      { id: '2-3', text: 'Create tRPC procedure for local pricing lookup by ZIP code', completed: true },
      { id: '2-4', text: 'Create tRPC procedure for material preview image generation', completed: true },
      { id: '2-5', text: 'Create tRPC procedure for project CRUD (create, read, update, delete)', completed: true },
      { id: '2-6', text: 'Create tRPC procedure for project share link generation', completed: true },
      { id: '2-7', text: 'Create tRPC procedure for sending email notifications (owner + contractor)', completed: true },
      { id: '2-8', text: 'Implement geolocation service to get user ZIP code', completed: true },
      { id: '2-9', text: 'Implement email service integration (SendGrid or similar)', completed: true },
      { id: '2-10', text: 'Write vitest tests for all backend procedures', completed: true },
    ],
  },
  {
    id: 'phase-3',
    title: 'Phase 3: Frontend — Camera & Measurement',
    items: [
      { id: '3-1', text: 'Build camera capture component with device permissions', completed: true },
      { id: '3-2', text: 'Build photo upload fallback for desktop testing', completed: true },
      { id: '3-3', text: 'Build corner adjustment UI with draggable markers', completed: false },
      { id: '3-4', text: 'Display AI-detected measurements (square feet)', completed: false },
      { id: '3-5', text: 'Display manual depth input or LiDAR sensor reading', completed: false },
      { id: '3-6', text: 'Build material selector grid (hotmix, millings, tar and chip, gravel)', completed: true },
      { id: '3-7', text: 'Display material pricing and quantity needed', completed: true },
      { id: '3-8', text: 'Create projects dashboard page', completed: true },
      { id: '3-9', text: 'Add touch/pointer event support for mobile corner dragging', completed: false },
      { id: '3-10', text: 'Recalculate square footage when corners are adjusted', completed: false },
      { id: '3-11', text: 'Add permission denied/unavailable error handling for camera', completed: true },
    ],
  },
  {
    id: 'phase-4',
    title: 'Phase 4: Frontend — Visualization & Sharing',
    items: [
      { id: '4-1', text: 'Build material preview canvas overlay (integrated in estimator)', completed: true },
      { id: '4-2', text: 'Integrate AI image generation for photorealistic material render (via tRPC)', completed: true },
      { id: '4-3', text: 'Build project dashboard with saved projects list', completed: true },
      { id: '4-4', text: 'Build project detail view with all measurements and pricing', completed: true },
      { id: '4-5', text: 'Build contractor share UI with email input and link generation', completed: true },
      { id: '4-6', text: 'Build shareable project summary page (public view)', completed: true },
      { id: '4-7', text: 'Build PDF export for project summary (jsPDF integration complete)', completed: true },
    ],
  },
  {
    id: 'phase-5',
    title: 'Phase 5: Integration & Testing',
    items: [
      { id: '5-1', text: 'Implement PDF export functionality for project summaries', completed: true },
      { id: '5-2', text: 'End-to-end test: capture → measure → select material → generate preview → save project', completed: true },
      { id: '5-3', text: 'End-to-end test: share project → send email → verify contractor can access', completed: true },
      { id: '5-4', text: 'Test geolocation and pricing accuracy (pricing service tests passing)', completed: true },
      { id: '5-5', text: 'Test responsive design on mobile devices (mobile-first CSS implemented)', completed: true },
      { id: '5-6', text: 'Performance optimization for image processing (S3 storage + lazy loading)', completed: true },
      { id: '5-7', text: 'Error handling and user feedback for all flows (toast notifications + error boundaries)', completed: true },
    ],
  },
  {
    id: 'phase-6',
    title: 'Phase 6: Deployment & Polish',
    items: [
      { id: '6-1', text: 'Create final checkpoint', completed: false },
      { id: '6-2', text: 'Verify all features working in production', completed: false },
      { id: '6-3', text: 'Document API endpoints and usage', completed: false },
      { id: '6-4', text: 'Prepare for user delivery', completed: false },
    ],
  },
  {
    id: 'phase-7',
    title: 'Phase 7: Mobile Conversion & GitHub',
    items: [
      { id: '7-1', text: 'Install and configure Capacitor', completed: true },
      { id: '7-2', text: 'Configure iOS native app', completed: false },
      { id: '7-3', text: 'Configure Android native app', completed: false },
      { id: '7-4', text: 'Set up camera permissions for mobile (configured in native projects)', completed: true },
      { id: '7-5', text: 'Test mobile app on iOS simulator', completed: false },
      { id: '7-6', text: 'Test mobile app on Android emulator', completed: false },
      { id: '7-7', text: 'Create GitHub repository', completed: true },
      { id: '7-8', text: 'Push code to GitHub', completed: true },
      { id: '7-9', text: 'Create build scripts for internal distribution', completed: false },
      { id: '7-10', text: 'Document mobile setup and build instructions (MOBILE_BUILD.md created)', completed: true },
    ],
  },
];

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<{ file: File; preview: string } | null>(null);
  const [phases, setPhases] = useState<TodoPhase[]>(INITIAL_PHASES);

  const handleToggleItem = (phaseId: string, itemId: string) => {
    setPhases((prev) =>
      prev.map((phase) =>
        phase.id !== phaseId
          ? phase
          : {
              ...phase,
              items: phase.items.map((item) =>
                item.id !== itemId ? item : { ...item, completed: !item.completed }
              ),
            }
      )
    );
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">🛣️</span>
            <h1 className="text-3xl md:text-4xl font-bold text-white">Easy Asphalt</h1>
          </div>
          <p className="text-slate-300">Driveway Estimator Pro</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Image Upload */}
          <div className="lg:col-span-2">
            <ImageUploadPanel
              onImageSelected={(file, preview) => {
                setSelectedImage({ file, preview });
              }}
            />
          </div>

          {/* Right Column - TODO Panel */}
          <div className="lg:col-span-1">
            <TodoSelector phases={phases} onToggleItem={handleToggleItem} />
          </div>
        </div>

        {/* Selected Image Info */}
        {selectedImage && (
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-300 text-sm">
              ✓ Image selected: <span className="font-medium">{selectedImage.file.name}</span>
            </p>
            <p className="text-blue-300 text-sm mt-1">
              Size: {(selectedImage.file.size / 1024 / 1024).toFixed(2)}MB
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
