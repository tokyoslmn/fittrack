import Link from "next/link";
import type {
  Meal,
  MealOption,
  SupplementPlan,
  WeeklySchedule,
  Workout,
} from "@prisma/client";

type MealWithOptions = Meal & { options: MealOption[] };

interface ScheduleTimelineProps {
  isTrainingDay: boolean;
  meals: MealWithOptions[];
  supplements: SupplementPlan[];
  todaySchedule: (WeeklySchedule & { workout: Workout | null }) | null;
  workoutCompleted: boolean;
  supplementLogs: { supplementName: string; taken: boolean }[];
}

export function ScheduleTimeline({
  isTrainingDay,
  meals,
  supplements: _supplements,
  todaySchedule,
  workoutCompleted,
  supplementLogs: _supplementLogs,
}: ScheduleTimelineProps) {
  // Build timeline items sorted by time
  const timelineItems: {
    time: string;
    type: "water" | "workout" | "meal";
    data?: MealWithOptions;
  }[] = [];

  // Morning water
  timelineItems.push({ time: "07:30", type: "water" });

  // Workout (if training day)
  if (isTrainingDay && todaySchedule?.workout) {
    timelineItems.push({ time: "08:00", type: "workout" });
  }

  // Meals
  for (const meal of meals) {
    timelineItems.push({ time: meal.time, type: "meal", data: meal });
  }

  // Sort by time
  timelineItems.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="relative pl-7">
      {/* Timeline line */}
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

      {timelineItems.map((item, i) => (
        <div key={i} className="relative mb-4">
          {/* Dot */}
          <div
            className={`absolute -left-5 top-1 h-3 w-3 rounded-full border-2 border-background ${
              item.type === "workout"
                ? "bg-primary"
                : item.type === "water"
                  ? "bg-success"
                  : "bg-muted-foreground/30"
            }`}
          />

          {item.type === "water" && (
            <div className="rounded-xl border border-border bg-muted p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {item.time}
                  </span>
                  <span className="ml-2">💧 Pola litra vode po buđenju</span>
                </div>
              </div>
            </div>
          )}

          {item.type === "workout" && todaySchedule?.workout && (
            <Link href="/client/workout">
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 cursor-pointer hover:bg-primary/15 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {item.time}
                    </span>
                    <span className="ml-2 font-semibold">
                      🏋️ {todaySchedule.workout.name}
                    </span>
                  </div>
                  <div className="text-sm">
                    {workoutCompleted ? (
                      <span className="text-success">✓ Završen</span>
                    ) : (
                      <span className="text-primary">Započni →</span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1 ml-11">
                  {todaySchedule.workout.focus}
                </div>
              </div>
            </Link>
          )}

          {item.type === "meal" && item.data && (
            <MealCard meal={item.data} />
          )}
        </div>
      ))}
    </div>
  );
}

function MealCard({ meal }: { meal: MealWithOptions }) {
  return (
    <div className="rounded-xl border border-border bg-muted p-3">
      <span className="text-xs text-muted-foreground font-mono">{meal.time}</span>
      <span className="ml-2">
        {meal.icon ?? "🍽️"} {meal.name}
      </span>
      <div className="mt-1.5 ml-11 flex gap-3 text-xs font-mono">
        <span className="text-secondary">P: {meal.protein}g</span>
        <span className="text-warning">C: {meal.carbs}g</span>
        <span className="text-success">F: {meal.fat}g</span>
      </div>
      {meal.options.length > 0 && (
        <div className="mt-2 ml-11 space-y-1.5">
          {meal.options.map((opt) => (
            <div key={opt.id}>
              <span className="text-xs text-primary">Opcija {opt.optionNumber}:</span>
              <div className="text-sm text-muted-foreground mt-0.5 rounded-md bg-card p-1.5">
                {opt.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
