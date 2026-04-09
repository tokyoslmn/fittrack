import { requireRole } from "@/lib/auth-utils";
import { getTodaySchedule } from "@/lib/queries/schedule";

export default async function NutritionPage() {
  const session = await requireRole("CLIENT");
  const schedule = await getTodaySchedule(session.user.id);

  const plan = schedule.nutritionPlan;
  const isTraining = schedule.isTrainingDay;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">🍽️ Današnja ishrana</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isTraining ? "Trening dan" : "Dan odmora"} —{" "}
          {plan
            ? `P: ${plan.totalProtein}g / C: ${isTraining ? plan.totalCarbsTrain : plan.totalCarbsRest}g / F: ${isTraining ? plan.totalFatTrain : plan.totalFatRest}g`
            : "Nema aktivnog plana"}
        </p>
      </div>

      {schedule.meals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nema definisanih obroka u planu.
        </p>
      ) : (
        <div className="space-y-3">
          {schedule.meals.map((meal) => (
            <div
              key={meal.id}
              className="rounded-xl border border-border bg-muted p-4"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {meal.icon || "🍽️"} {meal.name}
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {meal.time}
                </span>
              </div>
              <div className="mt-1.5 flex gap-3 text-xs font-mono">
                <span className="text-secondary">P: {meal.protein}g</span>
                <span className="text-warning">C: {meal.carbs}g</span>
                <span className="text-success">F: {meal.fat}g</span>
                <span className="text-muted-foreground">
                  {meal.protein * 4 + meal.carbs * 4 + meal.fat * 9} kcal
                </span>
              </div>

              {meal.options.length > 0 && (
                <div className="mt-3 space-y-2">
                  {meal.options.map((opt) => (
                    <div key={opt.id}>
                      <span className="text-xs font-medium text-primary">
                        Opcija {opt.optionNumber}
                      </span>
                      <div className="text-sm text-foreground mt-0.5 rounded-md bg-card p-2">
                        {opt.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nutrition rules */}
      {plan?.rules && (
        <div className="rounded-xl border border-border bg-muted p-4">
          <h2 className="font-semibold mb-2">📋 Pravila ishrane</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {(JSON.parse(plan.rules) as string[]).map((rule, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">•</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
