import { requireRole } from "@/lib/auth-utils";
import { getTodaySchedule } from "@/lib/queries/schedule";
import { ScheduleTimeline } from "@/components/client/schedule-timeline";
import { DailyStats } from "@/components/client/daily-stats";
import { DailyGoals } from "@/components/client/daily-goals";
import { QuickActions } from "@/components/client/quick-actions";

const DAY_NAMES = [
  "Ponedeljak",
  "Utorak",
  "Sreda",
  "Četvrtak",
  "Petak",
  "Subota",
  "Nedelja",
];

export default async function ClientPage() {
  const session = await requireRole("CLIENT");
  const schedule = await getTodaySchedule(session.user.id);

  const now = new Date();
  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const dayName = DAY_NAMES[dayOfWeek];
  const dateStr = now.toLocaleDateString("sr-Latn-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const waterTarget = 3500; // 3.5L default
  const supplementsTaken = schedule.supplementLogs.filter((l) => l.taken).length;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Date header */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          {dayName}
        </div>
        <div className="text-xl font-semibold">{dateStr}</div>
        {schedule.isTrainingDay && schedule.todaySchedule?.workout ? (
          <div className="inline-block mt-1.5 rounded-full bg-primary px-3.5 py-1 text-xs text-primary-foreground">
            🏋️ {schedule.todaySchedule.label} —{" "}
            {schedule.todaySchedule.workout.focus}
          </div>
        ) : (
          <div className="inline-block mt-1.5 rounded-full bg-muted px-3.5 py-1 text-xs text-muted-foreground">
            🌿 Dan odmora
          </div>
        )}
      </div>

      {/* Quick stats */}
      <DailyStats
        waterMl={schedule.totalWaterMl}
        waterTargetMl={waterTarget}
        proteinConsumed={0}
        proteinTarget={schedule.nutritionPlan?.totalProtein ?? 170}
        kcalConsumed={0}
        kcalTarget={schedule.nutritionPlan?.totalKcalMax ?? 1950}
      />

      {/* Timeline */}
      <ScheduleTimeline
        isTrainingDay={schedule.isTrainingDay}
        meals={schedule.meals}
        supplements={schedule.supplements}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        todaySchedule={schedule.todaySchedule as any}
        workoutCompleted={schedule.workoutCompleted}
        supplementLogs={schedule.supplementLogs}
      />

      {/* Supplements */}
      {schedule.supplements.length > 0 && (
        <div className="rounded-xl border border-border bg-muted p-3.5">
          <div className="font-semibold mb-2.5">💊 Suplementi</div>
          <div className="space-y-2">
            {schedule.supplements.map((sup) => {
              const taken =
                schedule.supplementLogs.find(
                  (l) => l.supplementName === sup.name
                )?.taken ?? false;
              return (
                <div key={sup.id} className="flex items-center gap-2 text-sm">
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center text-xs ${
                      taken
                        ? "bg-primary/20 border-primary text-primary"
                        : "border-border"
                    }`}
                  >
                    {taken && "✓"}
                  </div>
                  <span>{sup.name}</span>
                  <span className="text-muted-foreground">
                    — {sup.dose} {sup.timing}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily goals */}
      <DailyGoals
        waterMl={schedule.totalWaterMl}
        waterTarget={waterTarget}
        workoutCompleted={schedule.workoutCompleted}
        isTrainingDay={schedule.isTrainingDay}
        supplementsTaken={supplementsTaken}
        supplementsTotal={schedule.supplements.length}
        steps={schedule.dailyLog?.steps ?? null}
      />

      {/* Quick actions */}
      <QuickActions />
    </div>
  );
}
