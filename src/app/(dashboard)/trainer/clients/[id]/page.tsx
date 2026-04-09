import { requireRole } from "@/lib/auth-utils";
import { getClientDashboard } from "@/lib/queries/trainer";
import { MetricsCards } from "@/components/trainer/metrics-cards";
import { ComplianceGrid } from "@/components/trainer/compliance-grid";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ClientDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TRAINER");
  const { id } = await params;
  const data = await getClientDashboard(session.user.id, id);

  if (!data || !data.client) {
    redirect("/trainer");
  }

  const trainingDays = data.workoutPlan?.schedule.filter(
    (s) => s.type === "training"
  ).length ?? 3;

  // Build compliance data for the current week (Mon-Sun)
  const now = new Date();
  const complianceDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    const jsDay = now.getDay();
    const mondayOffset = jsDay === 0 ? 6 : jsDay - 1;
    date.setDate(now.getDate() - mondayOffset + i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const daySchedule = data.workoutPlan?.schedule.find(
      (s) => s.dayOfWeek === i
    );
    const isTrainingDay = daySchedule?.type === "training";

    const dayWorkoutLog = data.recentWorkoutLogs.find(
      (l) => new Date(l.date).toDateString() === dayStart.toDateString()
    );
    const dayWaterLogs = data.recentWaterLogs.filter(
      (l) => new Date(l.date).toDateString() === dayStart.toDateString()
    );
    const totalWater = dayWaterLogs.reduce((sum, l) => sum + l.amountMl, 0);
    const daySupLogs = data.recentSupplementLogs.filter(
      (l) => new Date(l.date).toDateString() === dayStart.toDateString() && l.taken
    );

    return {
      date: dayStart,
      workout: isTrainingDay ? (dayWorkoutLog?.completed ?? false) : null,
      water: totalWater >= 3000,
      supplements: daySupLogs.length > 0,
    };
  });

  const latestLab = data.labResults[0];
  const flaggedItems = latestLab?.items.filter(
    (item) => item.status !== "ok"
  ) ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{data.client.name}</h1>
        <p className="text-sm text-muted-foreground">{data.client.email}</p>
      </div>

      {/* Metrics */}
      <MetricsCards
        weight={data.latestWeight?.weight ?? null}
        bmi={data.latestBodyComp?.bmi ?? null}
        bodyFatPct={data.latestBodyComp?.bodyFatPct ?? null}
        workoutsThisWeek={data.recentWorkoutLogs.filter((l) => l.completed).length}
        trainingDaysPerWeek={trainingDays}
      />

      {/* Compliance */}
      <ComplianceGrid days={complianceDays} />

      {/* Weight history */}
      {data.weightHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-muted p-4">
          <h3 className="font-semibold mb-3">Trend težine</h3>
          <div className="space-y-1.5">
            {data.weightHistory.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {new Date(log.date).toLocaleDateString("sr-Latn-RS")}
                </span>
                <span className="font-mono">{log.weight} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lab alerts */}
      {flaggedItems.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <h3 className="font-semibold mb-2 text-warning">Lab rezultati — upozorenja</h3>
          <div className="space-y-1">
            {flaggedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{item.value} {item.unit}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      item.status === "high"
                        ? "bg-danger/20 text-danger"
                        : item.status === "low"
                          ? "bg-primary/20 text-primary"
                          : "bg-warning/20 text-warning"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {latestLab.labName} — {new Date(latestLab.date).toLocaleDateString("sr-Latn-RS")}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href={`/trainer/clients/${id}/nutrition`}
          className="rounded-xl border border-border bg-muted p-3 text-center hover:bg-accent transition-colors"
        >
          <div className="text-xl">🍽️</div>
          <div className="text-sm mt-1">Ishrana</div>
        </Link>
        <Link
          href={`/trainer/clients/${id}/workout`}
          className="rounded-xl border border-border bg-muted p-3 text-center hover:bg-accent transition-colors"
        >
          <div className="text-xl">🏋️</div>
          <div className="text-sm mt-1">Trening</div>
        </Link>
        <Link
          href={`/trainer/clients/${id}/schedule`}
          className="rounded-xl border border-border bg-muted p-3 text-center hover:bg-accent transition-colors"
        >
          <div className="text-xl">📅</div>
          <div className="text-sm mt-1">Raspored</div>
        </Link>
      </div>
    </div>
  );
}
