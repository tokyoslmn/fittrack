"use client";

interface DailyGoalsProps {
  waterMl: number;
  waterTarget: number;
  workoutCompleted: boolean;
  isTrainingDay: boolean;
  supplementsTaken: number;
  supplementsTotal: number;
  steps: number | null;
}

export function DailyGoals({
  waterMl,
  waterTarget,
  workoutCompleted,
  isTrainingDay,
  supplementsTaken,
  supplementsTotal,
  steps,
}: DailyGoalsProps) {
  const goals = [
    {
      label: `Voda (3-4L)`,
      done: waterMl >= waterTarget,
      detail: `${(waterMl / 1000).toFixed(1)}L`,
    },
    {
      label: "Suplementi",
      done: supplementsTaken >= supplementsTotal && supplementsTotal > 0,
      detail: `${supplementsTaken}/${supplementsTotal}`,
    },
    ...(isTrainingDay
      ? [
          {
            label: "Trening",
            done: workoutCompleted,
            detail: workoutCompleted ? "Završen" : "Nije završen",
          },
        ]
      : []),
    {
      label: "Koraci (5000-7000)",
      done: (steps ?? 0) >= 5000,
      detail: steps ? `${steps}` : "—",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-muted p-3.5">
      <div className="font-semibold mb-2.5">✅ Dnevni ciljevi</div>
      <div className="space-y-2">
        {goals.map((goal) => (
          <div key={goal.label} className="flex items-center gap-2 text-sm">
            <div
              className={`h-4 w-4 rounded border flex items-center justify-center text-xs ${
                goal.done
                  ? "bg-success/20 border-success text-success"
                  : "border-border"
              }`}
            >
              {goal.done && "✓"}
            </div>
            <span className={goal.done ? "text-muted-foreground" : ""}>
              {goal.label}
            </span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {goal.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
