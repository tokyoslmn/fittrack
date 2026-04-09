"use client";

import { useState } from "react";
import type { WarmupExercise } from "@prisma/client";

interface WorkoutWarmupsProps {
  warmups: WarmupExercise[];
}

export function WorkoutWarmups({ warmups }: WorkoutWarmupsProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const doneCount = completed.size;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="rounded-full bg-warning px-2.5 py-0.5 text-xs font-bold text-background uppercase tracking-wide">
          Aktivacije
        </span>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{warmups.length} završeno
        </span>
      </div>

      <div className="space-y-2">
        {warmups.map((w) => {
          const isDone = completed.has(w.id);
          return (
            <div
              key={w.id}
              className={`rounded-xl border p-3 transition-all cursor-pointer ${
                isDone
                  ? "border-success/20 bg-success/5 opacity-70"
                  : "border-border bg-muted"
              }`}
              onClick={() => toggle(w.id)}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs ${
                    isDone
                      ? "bg-success/20 border-success text-success"
                      : "border-border"
                  }`}
                >
                  {isDone && "✓"}
                </div>
                <span className={isDone ? "line-through text-muted-foreground" : ""}>
                  {w.name}
                </span>
                {w.videoUrl && (
                  <a
                    href={w.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ▶ Video
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
