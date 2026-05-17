"use client";

import { useState } from "react";

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoPhase {
  id: string;
  title: string;
  items: TodoItem[];
}

interface TodoSelectorProps {
  phases: TodoPhase[];
  onToggleItem?: (phaseId: string, itemId: string) => void;
  onSelectPhase?: (phaseId: string) => void;
  selectedPhaseId?: string | null;
}

function PhaseHeader({
  phase,
  isOpen,
  isSelected,
  onToggleOpen,
  onSelect,
}: {
  phase: TodoPhase;
  isOpen: boolean;
  isSelected: boolean;
  onToggleOpen: () => void;
  onSelect: () => void;
}) {
  const total = phase.items.length;
  const done = phase.items.filter((i) => i.completed).length;
  const allDone = total > 0 && done === total;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div
      className={`group relative rounded-xl border transition-all duration-200 ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md dark:border-blue-400 dark:bg-blue-950/40"
          : "border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600"
      }`}
    >
      {/* Header row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Select button */}
        <button
          onClick={onSelect}
          title={isSelected ? "Phase selected" : "Select this phase"}
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition ${
            isSelected
              ? "border-blue-500 bg-blue-500 text-white"
              : "border-zinc-300 text-transparent hover:border-blue-400 dark:border-zinc-600"
          }`}
          aria-pressed={isSelected}
        >
          {isSelected && (
            <svg
              viewBox="0 0 12 10"
              fill="none"
              className="h-3 w-3"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="1,5 4,8 11,1" />
            </svg>
          )}
        </button>

        {/* Phase title — clicking expands/collapses */}
        <button
          onClick={onToggleOpen}
          className="flex flex-1 items-center gap-2 text-left"
        >
          <span
            className={`font-semibold transition ${
              isSelected
                ? "text-blue-700 dark:text-blue-300"
                : "text-zinc-800 dark:text-zinc-100"
            }`}
          >
            {phase.title}
          </span>
          {allDone && (
            <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/40 dark:text-green-400">
              Complete
            </span>
          )}
        </button>

        {/* Progress badge */}
        <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
          {done}/{total}
        </span>

        {/* Chevron */}
        <button
          onClick={onToggleOpen}
          className="shrink-0 text-zinc-400 transition hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label={isOpen ? "Collapse" : "Expand"}
        >
          <svg
            viewBox="0 0 16 16"
            fill="currentColor"
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          >
            <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth={1.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      {total > 0 && (
        <div className="mx-4 mb-3 h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              allDone ? "bg-green-500" : "bg-blue-500"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function TodoItemRow({
  item,
  onToggle,
}: {
  item: TodoItem;
  onToggle: () => void;
}) {
  return (
    <li className="flex items-start gap-3 py-1.5">
      <button
        onClick={onToggle}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition ${
          item.completed
            ? "border-green-500 bg-green-500 text-white"
            : "border-zinc-300 hover:border-green-400 dark:border-zinc-600"
        }`}
        aria-checked={item.completed}
        role="checkbox"
      >
        {item.completed && (
          <svg
            viewBox="0 0 12 10"
            fill="none"
            className="h-3 w-3"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="1,5 4,8 11,1" />
          </svg>
        )}
      </button>
      <span
        className={`text-sm leading-relaxed transition ${
          item.completed
            ? "text-zinc-400 line-through dark:text-zinc-600"
            : "text-zinc-700 dark:text-zinc-300"
        }`}
      >
        {item.text}
      </span>
    </li>
  );
}

export default function TodoSelector({
  phases,
  onToggleItem,
  onSelectPhase,
  selectedPhaseId,
}: TodoSelectorProps) {
  const [openPhases, setOpenPhases] = useState<Set<string>>(
    () => new Set(phases.map((p) => p.id))
  );

  const toggleOpen = (phaseId: string) => {
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  const totalItems = phases.reduce((s, p) => s + p.items.length, 0);
  const doneItems = phases.reduce(
    (s, p) => s + p.items.filter((i) => i.completed).length,
    0
  );
  const overallProgress = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* Overall progress */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            Overall Progress
          </span>
          <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {doneItems}/{totalItems} tasks &mdash; {overallProgress}%
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Phase list */}
      <div className="flex flex-col gap-3">
        {phases.map((phase) => {
          const isOpen = openPhases.has(phase.id);
          const isSelected = selectedPhaseId === phase.id;

          return (
            <div key={phase.id} className="flex flex-col gap-0">
              <PhaseHeader
                phase={phase}
                isOpen={isOpen}
                isSelected={isSelected}
                onToggleOpen={() => toggleOpen(phase.id)}
                onSelect={() => onSelectPhase?.(phase.id)}
              />

              {/* Collapsible items */}
              {isOpen && phase.items.length > 0 && (
                <div className="ml-4 mt-1 rounded-b-xl border-x border-b border-zinc-200 bg-zinc-50 px-4 py-2 dark:border-zinc-700 dark:bg-zinc-800/50">
                  <ul className="divide-y divide-zinc-100 dark:divide-zinc-700/50">
                    {phase.items.map((item) => (
                      <TodoItemRow
                        key={item.id}
                        item={item}
                        onToggle={() => onToggleItem?.(phase.id, item.id)}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {isOpen && phase.items.length === 0 && (
                <div className="ml-4 mt-1 rounded-b-xl border-x border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-400 dark:border-zinc-700 dark:bg-zinc-800/50">
                  No items in this phase.
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
