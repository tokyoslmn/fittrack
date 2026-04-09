"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MealOption {
  optionNumber: number;
  description: string;
}

interface MealData {
  name: string;
  time: string;
  orderIndex: number;
  isTrainingDay: boolean;
  protein: number;
  carbs: number;
  fat: number;
  icon: string;
  options: MealOption[];
}

interface SupplementData {
  name: string;
  dose: string;
  timing: string;
  icon: string;
}

interface NutritionPlanData {
  name: string;
  totalProtein: number;
  totalCarbsTrain: number;
  totalCarbsRest: number;
  totalFatTrain: number;
  totalFatRest: number;
  totalKcalMin: number;
  totalKcalMax: number;
  rules: string;
  meals: MealData[];
  supplements: SupplementData[];
}

interface NutritionEditorProps {
  clientId: string;
  initialData: NutritionPlanData | null;
}

export function NutritionEditor({ clientId, initialData }: NutritionEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<NutritionPlanData>(
    initialData ?? {
      name: "",
      totalProtein: 0,
      totalCarbsTrain: 0,
      totalCarbsRest: 0,
      totalFatTrain: 0,
      totalFatRest: 0,
      totalKcalMin: 0,
      totalKcalMax: 0,
      rules: "[]",
      meals: [],
      supplements: [],
    }
  );

  function updateField<K extends keyof NutritionPlanData>(
    key: K,
    value: NutritionPlanData[K]
  ) {
    setPlan((prev) => ({ ...prev, [key]: value }));
  }

  function addMeal(isTrainingDay: boolean) {
    const meals = plan.meals.filter((m) => m.isTrainingDay === isTrainingDay);
    setPlan((prev) => ({
      ...prev,
      meals: [
        ...prev.meals,
        {
          name: "",
          time: "12:00",
          orderIndex: meals.length,
          isTrainingDay,
          protein: 0,
          carbs: 0,
          fat: 0,
          icon: "🍽️",
          options: [{ optionNumber: 1, description: "" }],
        },
      ],
    }));
  }

  function updateMeal(index: number, update: Partial<MealData>) {
    setPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((m, i) => (i === index ? { ...m, ...update } : m)),
    }));
  }

  function removeMeal(index: number) {
    setPlan((prev) => ({
      ...prev,
      meals: prev.meals.filter((_, i) => i !== index),
    }));
  }

  function addOption(mealIndex: number) {
    const meal = plan.meals[mealIndex];
    const newOpt: MealOption = {
      optionNumber: meal.options.length + 1,
      description: "",
    };
    updateMeal(mealIndex, { options: [...meal.options, newOpt] });
  }

  function updateOption(mealIndex: number, optIndex: number, description: string) {
    const meal = plan.meals[mealIndex];
    const options = meal.options.map((o, i) =>
      i === optIndex ? { ...o, description } : o
    );
    updateMeal(mealIndex, { options });
  }

  function addSupplement() {
    setPlan((prev) => ({
      ...prev,
      supplements: [
        ...prev.supplements,
        { name: "", dose: "", timing: "", icon: "💊" },
      ],
    }));
  }

  function updateSupplement(index: number, update: Partial<SupplementData>) {
    setPlan((prev) => ({
      ...prev,
      supplements: prev.supplements.map((s, i) =>
        i === index ? { ...s, ...update } : s
      ),
    }));
  }

  function removeSupplement(index: number) {
    setPlan((prev) => ({
      ...prev,
      supplements: prev.supplements.filter((_, i) => i !== index),
    }));
  }

  async function savePlan() {
    setSaving(true);
    const res = await fetch("/api/trainer/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, ...plan }),
    });
    setSaving(false);
    if (res.ok) {
      router.refresh();
    }
  }

  const trainingMeals = plan.meals
    .map((m, i) => ({ ...m, _index: i }))
    .filter((m) => m.isTrainingDay);
  const restMeals = plan.meals
    .map((m, i) => ({ ...m, _index: i }))
    .filter((m) => !m.isTrainingDay);

  return (
    <div className="space-y-6">
      {/* Plan name */}
      <div className="space-y-1.5">
        <Label>Naziv plana</Label>
        <Input
          value={plan.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="npr. Rekompozicija — Faza 1"
        />
      </div>

      {/* Macro targets */}
      <div>
        <h3 className="font-semibold mb-2">Makro ciljevi</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Protein (g)</Label>
            <Input
              type="number"
              value={plan.totalProtein || ""}
              onChange={(e) => updateField("totalProtein", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ugljeni trening (g)</Label>
            <Input
              type="number"
              value={plan.totalCarbsTrain || ""}
              onChange={(e) => updateField("totalCarbsTrain", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ugljeni odmor (g)</Label>
            <Input
              type="number"
              value={plan.totalCarbsRest || ""}
              onChange={(e) => updateField("totalCarbsRest", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Masti trening (g)</Label>
            <Input
              type="number"
              value={plan.totalFatTrain || ""}
              onChange={(e) => updateField("totalFatTrain", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Masti odmor (g)</Label>
            <Input
              type="number"
              value={plan.totalFatRest || ""}
              onChange={(e) => updateField("totalFatRest", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Min kcal</Label>
            <Input
              type="number"
              value={plan.totalKcalMin || ""}
              onChange={(e) => updateField("totalKcalMin", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max kcal</Label>
            <Input
              type="number"
              value={plan.totalKcalMax || ""}
              onChange={(e) => updateField("totalKcalMax", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* Training day meals */}
      <MealSection
        title="Obroci — Trening dan"
        meals={trainingMeals}
        onUpdate={updateMeal}
        onRemove={removeMeal}
        onAddOption={addOption}
        onUpdateOption={updateOption}
        onAdd={() => addMeal(true)}
      />

      {/* Rest day meals */}
      <MealSection
        title="Obroci — Dan odmora"
        meals={restMeals}
        onUpdate={updateMeal}
        onRemove={removeMeal}
        onAddOption={addOption}
        onUpdateOption={updateOption}
        onAdd={() => addMeal(false)}
      />

      {/* Supplements */}
      <div>
        <h3 className="font-semibold mb-2">Suplementi</h3>
        <div className="space-y-2">
          {plan.supplements.map((sup, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Naziv"
                  value={sup.name}
                  onChange={(e) => updateSupplement(i, { name: e.target.value })}
                />
              </div>
              <div className="w-32 space-y-1">
                <Input
                  placeholder="Doza"
                  value={sup.dose}
                  onChange={(e) => updateSupplement(i, { dose: e.target.value })}
                />
              </div>
              <div className="w-32 space-y-1">
                <Input
                  placeholder="Tajming"
                  value={sup.timing}
                  onChange={(e) => updateSupplement(i, { timing: e.target.value })}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSupplement(i)}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addSupplement}>
            + Suplement
          </Button>
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-1.5">
        <Label>Pravila ishrane (jedno pravilo po redu)</Label>
        <textarea
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
          value={(() => {
            try {
              return (JSON.parse(plan.rules) as string[]).join("\n");
            } catch {
              return plan.rules;
            }
          })()}
          onChange={(e) =>
            updateField(
              "rules",
              JSON.stringify(e.target.value.split("\n").filter(Boolean))
            )
          }
        />
      </div>

      {/* Save */}
      <Button className="w-full" size="lg" onClick={savePlan} disabled={saving}>
        {saving ? "Čuvanje..." : "Sačuvaj plan ishrane"}
      </Button>
    </div>
  );
}

// ─── Meal Section ────────────────────────────────────────────

interface MealWithIndex extends MealData {
  _index: number;
}

function MealSection({
  title,
  meals,
  onUpdate,
  onRemove,
  onAddOption,
  onUpdateOption,
  onAdd,
}: {
  title: string;
  meals: MealWithIndex[];
  onUpdate: (index: number, update: Partial<MealData>) => void;
  onRemove: (index: number) => void;
  onAddOption: (mealIndex: number) => void;
  onUpdateOption: (mealIndex: number, optIndex: number, desc: string) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="space-y-3">
        {meals.map((meal) => (
          <div
            key={meal._index}
            className="rounded-lg border border-border bg-card p-3 space-y-2"
          >
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Naziv obroka"
                  value={meal.name}
                  onChange={(e) => onUpdate(meal._index, { name: e.target.value })}
                />
              </div>
              <div className="w-20">
                <Input
                  type="time"
                  value={meal.time}
                  onChange={(e) => onUpdate(meal._index, { time: e.target.value })}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(meal._index)}
              >
                ✕
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="w-20">
                <Label className="text-xs">P (g)</Label>
                <Input
                  type="number"
                  value={meal.protein || ""}
                  onChange={(e) =>
                    onUpdate(meal._index, { protein: parseInt(e.target.value) || 0 })
                  }
                  className="font-mono h-8"
                />
              </div>
              <div className="w-20">
                <Label className="text-xs">C (g)</Label>
                <Input
                  type="number"
                  value={meal.carbs || ""}
                  onChange={(e) =>
                    onUpdate(meal._index, { carbs: parseInt(e.target.value) || 0 })
                  }
                  className="font-mono h-8"
                />
              </div>
              <div className="w-20">
                <Label className="text-xs">F (g)</Label>
                <Input
                  type="number"
                  value={meal.fat || ""}
                  onChange={(e) =>
                    onUpdate(meal._index, { fat: parseInt(e.target.value) || 0 })
                  }
                  className="font-mono h-8"
                />
              </div>
            </div>
            {/* Options */}
            <div className="space-y-1.5">
              {meal.options.map((opt, oi) => (
                <div key={oi} className="flex gap-2 items-center">
                  <span className="text-xs text-primary w-6">#{opt.optionNumber}</span>
                  <Input
                    placeholder="Opis opcije"
                    value={opt.description}
                    onChange={(e) => onUpdateOption(meal._index, oi, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onAddOption(meal._index)}
              >
                + Opcija
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={onAdd}>
          + Obrok
        </Button>
      </div>
    </div>
  );
}
