import { requireRole } from "@/lib/auth-utils";
import { getTodayMealLogs } from "@/lib/queries/logs";
import { MealLogForm } from "@/components/client/meal-log-form";

export default async function FoodPage() {
  const session = await requireRole("CLIENT");
  const mealLogs = await getTodayMealLogs(session.user.id);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Dnevnik ishrane</h1>

      <div className="rounded-xl border border-border bg-muted p-4">
        <MealLogForm />
      </div>

      {mealLogs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Danas
          </h2>
          <div className="space-y-2">
            {mealLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-border bg-muted p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{log.mealName}</span>
                  <span className="text-xs text-muted-foreground">{log.time}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {log.description}
                </div>
                {!log.onPlan && (
                  <span className="inline-block mt-1 text-xs text-warning">
                    Van plana
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
