import { useState, useMemo } from "react";
import { ChevronDown, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

interface TodoPhase {
  id: string;
  name: string;
  status: "Incomplete" | "Complete";
  items: TodoItem[];
}

const TODO_DATA: TodoPhase[] = [
  {
    id: "phase-1",
    name: "Phase 1: Database & Schema",
    status: "Complete",
    items: [
      { id: "1-1", text: "Define projects table with user_id, photo_url, measurements, material, pricing", completed: true },
      { id: "1-2", text: "Define project_shares table for contractor sharing with unique tokens", completed: true },
      { id: "1-3", text: "Define material_prices table for caching regional pricing", completed: true },
      { id: "1-4", text: "Create Drizzle migrations and apply to database", completed: true },
    ],
  },
  {
    id: "phase-2",
    name: "Phase 2: Backend API",
    status: "Complete",
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
    name: "Phase 3: Frontend — Camera & Measurement",
    status: "Incomplete",
    items: [
      { id: "3-1", text: "Build camera capture component with device permissions", completed: true },
      { id: "3-2", text: "Build photo upload fallback for desktop testing", completed: true },
      { id: "3-3", text: "Build corner adjustment UI with draggable markers", completed: false },
      { id: "3-4", text: "Display AI-detected measurements (square feet)", completed: false },
      { id: "3-5", text: "Display manual depth input or LiDAR sensor reading", completed: false },
      { id: "3-6", text: "Build material selector grid (hotmix, millings, tar and chip, gravel)", completed: true },
      { id: "3-7", text: "Display material pricing and quantity needed", completed: true },
      { id: "3-8", text: "Create projects dashboard page", completed: true },
      { id: "3-9", text: "Add touch/pointer event support for mobile corner dragging", completed: false },
      { id: "3-10", text: "Recalculate square footage when corners are adjusted", completed: false },
      { id: "3-11", text: "Add permission denied/unavailable error handling for camera", completed: true },
    ],
  },
  {
    id: "phase-4",
    name: "Phase 4: Frontend — Visualization & Sharing",
    status: "Complete",
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
    name: "Phase 5: Integration & Testing",
    status: "Complete",
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
    name: "Phase 6: Deployment & Polish",
    status: "Incomplete",
    items: [
      { id: "6-1", text: "Create final checkpoint", completed: false },
      { id: "6-2", text: "Verify all features working in production", completed: false },
      { id: "6-3", text: "Document API endpoints and usage", completed: false },
      { id: "6-4", text: "Prepare for user delivery", completed: false },
    ],
  },
  {
    id: "phase-7",
    name: "Phase 7: Mobile Conversion & GitHub",
    status: "Incomplete",
    items: [
      { id: "7-1", text: "Install and configure Capacitor", completed: true },
      { id: "7-2", text: "Configure iOS native app", completed: false },
      { id: "7-3", text: "Configure Android native app", completed: false },
      { id: "7-4", text: "Set up camera permissions for mobile (configured in native projects)", completed: true },
      { id: "7-5", text: "Test mobile app on iOS simulator", completed: false },
      { id: "7-6", text: "Test mobile app on Android emulator", completed: false },
      { id: "7-7", text: "Create GitHub repository", completed: true },
      { id: "7-8", text: "Push code to GitHub", completed: true },
      { id: "7-9", text: "Create build scripts for internal distribution", completed: false },
      { id: "7-10", text: "Document mobile setup and build instructions (MOBILE_BUILD.md created)", completed: true },
    ],
  },
];

export default function ProjectTodoPanel() {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set(TODO_DATA.map(p => p.id))
  );
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [todos, setTodos] = useState<TodoPhase[]>(TODO_DATA);

  const togglePhase = (phaseId: string) => {
    const newExpanded = new Set(expandedPhases);
    if (newExpanded.has(phaseId)) {
      newExpanded.delete(phaseId);
    } else {
      newExpanded.add(phaseId);
    }
    setExpandedPhases(newExpanded);
  };

  const toggleTodo = (phaseId: string, itemId: string) => {
    setTodos(
      todos.map(phase =>
        phase.id === phaseId
          ? {
              ...phase,
              items: phase.items.map(item =>
                item.id === itemId ? { ...item, completed: !item.completed } : item
              ),
            }
          : phase
      )
    );
  };

  const stats = useMemo(() => {
    const totalItems = todos.reduce((sum, phase) => sum + phase.items.length, 0);
    const completedItems = todos.reduce(
      (sum, phase) => sum + phase.items.filter(item => item.completed).length,
      0
    );
    return {
      total: totalItems,
      completed: completedItems,
      percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
    };
  }, [todos]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-900 rounded-lg border border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-700 bg-slate-800/50">
        <h2 className="text-lg font-semibold text-white mb-3">Project TODO</h2>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-300">
              {stats.completed}/{stats.total} tasks — {stats.percentage}%
            </span>
          </div>
          <Progress value={stats.percentage} className="h-2" />
        </div>
      </div>

      {/* Phases List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          {todos.map(phase => {
            const phaseCompleted = phase.items.filter(item => item.completed).length;
            const phaseTotal = phase.items.length;
            const isExpanded = expandedPhases.has(phase.id);
            const isSelected = selectedPhase === phase.id;

            return (
              <div
                key={phase.id}
                className={cn(
                  "rounded-lg border transition-colors",
                  isSelected
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-slate-700 bg-slate-800/30 hover:bg-slate-800/50"
                )}
              >
                {/* Phase Header */}
                <button
                  onClick={() => {
                    togglePhase(phase.id);
                    setSelectedPhase(phase.id);
                  }}
                  className="w-full px-3 py-2 flex items-center justify-between text-left hover:bg-slate-700/30 transition-colors rounded-t-lg"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <ChevronDown
                      className={cn(
                        "w-4 h-4 text-slate-400 shrink-0 transition-transform",
                        isExpanded ? "rotate-0" : "-rotate-90"
                      )}
                    />
                    <span className="text-sm font-medium text-white truncate">
                      {phase.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <span className="text-xs text-slate-400">
                      {phaseCompleted}/{phaseTotal}
                    </span>
                    {phase.status === "Complete" && (
                      <Badge variant="secondary" className="text-xs">
                        Complete
                      </Badge>
                    )}
                  </div>
                </button>

                {/* Phase Items */}
                {isExpanded && (
                  <div className="px-3 py-2 border-t border-slate-700 space-y-1.5 bg-slate-900/50">
                    {phase.items.map(item => (
                      <div
                        key={item.id}
                        className="flex items-start gap-2 p-1.5 rounded hover:bg-slate-700/20 transition-colors"
                      >
                        <button
                          onClick={() => toggleTodo(phase.id, item.id)}
                          className="mt-0.5 shrink-0 focus:outline-none"
                          aria-label={`Toggle ${item.text}`}
                        >
                          {item.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          ) : (
                            <Circle className="w-4 h-4 text-slate-500" />
                          )}
                        </button>
                        <span
                          className={cn(
                            "text-xs leading-relaxed",
                            item.completed
                              ? "text-slate-500 line-through"
                              : "text-slate-300"
                          )}
                        >
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
