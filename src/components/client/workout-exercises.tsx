"use client";

import { useState } from "react";
import type { Exercise } from "@prisma/client";
import { Input } from "@/components/ui/input";

interface ExerciseLogData {
  exerciseId: string;
  completed: boolean;
  weight?: number;
  reps?: string;
}

interface WorkoutExercisesProps {
  exercises: Exercise[];
  onLogsChange: (logs: ExerciseLogData[]) => void;
}

export function WorkoutExercises({ exercises, onLogsChange }: WorkoutExercisesProps) {
  const [logs, setLogs] = useState<Map<string, ExerciseLogData>>(new Map());
  const [expanded, setExpanded] = useState<string | null>(exercises[0]?.id ?? null);

  const doneCount = Array.from(logs.values()).filter((l) => l.completed).length;

  function updateLog(exerciseId: string, update: Partial<ExerciseLogData>) {
    setLogs((prev) => {
      const next = new Map(prev);
      const current = next.get(exerciseId) ?? {
        exerciseId,
        completed: false,
      };
      next.set(exerciseId, { ...current, ...update });
      onLogsChange(Array.from(next.values()));
      return next;
    });
  }

  // Parse sets like "2×12" to get set count
  function getSetCount(sets: string): number {
    const match = sets.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 2;
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground uppercase tracking-wide">
          Glavni deo
        </span>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{exercises.length} završeno
        </span>
      </div>

      <div className="space-y-2">
        {exercises.map((ex) => {
          const isExpanded = expanded === ex.id;
          const log = logs.get(ex.id);
          const isDone = log?.completed ?? false;
          const setCount = getSetCount(ex.sets);

          return (
            <div
              key={ex.id}
              className={`rounded-xl border p-3 transition-all ${
                isDone
                  ? "border-success/20 bg-success/5 opacity-70"
                  : isExpanded
                    ? "border-primary/25 bg-primary/5"
                    : "border-border bg-muted"
              }`}
            >
              <div
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : ex.id)}
              >
                <div
                  className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs cursor-pointer ${
                    isDone
                      ? "bg-success/20 border-success text-success"
                      : "border-border"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLog(ex.id, { completed: !isDone });
                  }}
                >
                  {isDone && "✓"}
                </div>
                <div className="flex-1">
                  <span className="text-xs text-primary font-bold font-mono">
                    {ex.exerciseId}
                  </span>
                  <span className="ml-1.5 font-medium">{ex.name}</span>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {ex.sets}
                    {ex.note && ` · ${ex.note}`}
                  </div>
                </div>
                {ex.videoUrl && (
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ▶ Video
                  </a>
                )}
              </div>

              {isExpanded && !isDone && (
                <div className="mt-3 ml-7 space-y-2">
                  {ex.note && (
                    <div className="text-sm text-warning italic">
                      💡 {ex.note}
                    </div>
                  )}
                  {Array.from({ length: setCount }, (_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12">
                        Set {i + 1}:
                      </span>
                      <Input
                        type="number"
                        placeholder="kg"
                        className="w-16 h-8 text-sm font-mono"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) updateLog(ex.id, { weight: val });
                        }}
                      />
                      <span className="text-muted-foreground text-sm">×</span>
                      <Input
                        type="number"
                        placeholder="rep"
                        className="w-14 h-8 text-sm font-mono"
                        onChange={(e) => {
                          updateLog(ex.id, { reps: e.target.value });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
