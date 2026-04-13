import { requireRole } from "@/lib/auth-utils";
import { getClientNutritionPlan } from "@/lib/queries/trainer";
import { NutritionEditor } from "@/components/trainer/nutrition-editor";

export default async function NutritionEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TRAINER");
  const { id } = await params;
  const plan = await getClientNutritionPlan(session.user.id, id);

  const initialData = plan
    ? {
        name: plan.name,
        totalProtein: plan.totalProtein,
        totalCarbsTrain: plan.totalCarbsTrain,
        totalCarbsRest: plan.totalCarbsRest,
        totalFatTrain: plan.totalFatTrain,
        totalFatRest: plan.totalFatRest,
        totalKcalMin: plan.totalKcalMin,
        totalKcalMax: plan.totalKcalMax,
        rules: plan.rules,
        meals: plan.meals.map((m) => ({
          name: m.name,
          time: m.time,
          orderIndex: m.orderIndex,
          isTrainingDay: m.isTrainingDay,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
          icon: m.icon ?? "🍽️",
          options: m.options.map((o) => ({
            optionNumber: o.optionNumber,
            description: o.description,
            ingredients: (o.items ?? []).map((item) => {
              const factor = item.quantity / 100;
              return {
                foodItemId: item.foodItemId,
                foodItemName: item.foodItem.name,
                quantity: item.quantity,
                protein: Math.round(item.foodItem.protein * factor * 10) / 10,
                carbs: Math.round(item.foodItem.carbs * factor * 10) / 10,
                fat: Math.round(item.foodItem.fat * factor * 10) / 10,
                calories: Math.round(item.foodItem.calories * factor),
              };
            }),
          })),
        })),
        supplements: plan.supplements.map((s) => ({
          name: s.name,
          dose: s.dose,
          timing: s.timing,
          icon: s.icon ?? "💊",
        })),
      }
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Plan ishrane</h1>
      <NutritionEditor clientId={id} initialData={initialData} />
    </div>
  );
}
