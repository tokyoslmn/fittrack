"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DAY_NAMES = [
  "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota", "Nedelja",
];

interface WorkoutOption {
  id: string;
  name: string;
}

interface ScheduleDay {
  dayOfWeek: number;
  dayName: string;
  type: "training" | "rest";
  workoutId: string | null;
  label: string;
  restNotes: string | null;
}

interface ScheduleEditorProps {
  planId: string;
  initialDays: ScheduleDay[];
  workouts: WorkoutOption[];
}

export function ScheduleEditor({ planId, initialDays, workouts }: ScheduleEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<ScheduleDay[]>(
    initialDays.length === 7
      ? initialDays
      : DAY_NAMES.map((name, i) => ({
          dayOfWeek: i,
          dayName: name,
          type: "rest",
          workoutId: null,
          label: "Odmor / Šetnja",
          restNotes: null,
        }))
  );

  function updateDay(i: number, update: Partial<ScheduleDay>) {
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...update } : d)));
  }

  function toggleType(i: number) {
    const day = days[i];
    if (day.type === "training") {
      updateDay(i, {
        type: "rest",
        workoutId: null,
        label: "Odmor / Šetnja",
        restNotes: "Min 5000-7000 koraka",
      });
    } else {
      updateDay(i, {
        type: "training",
        workoutId: workouts[0]?.id ?? null,
        label: workouts[0]?.name ?? "Trening",
        restNotes: null,
      });
    }
  }

  async function saveSchedule() {
    setSaving(true);
    await fetch("/api/trainer/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, days }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {days.map((day, i) => (
        <div
          key={i}
          className={`rounded-xl border p-3 ${
            day.type === "training"
              ? "border-primary/20 bg-primary/5"
              : "border-border bg-muted"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{day.dayName}</span>
            <Button
              variant={day.type === "training" ? "default" : "outline"}
              size="xs"
              onClick={() => toggleType(i)}
            >
              {day.type === "training" ? "Trening" : "Odmor"}
            </Button>
          </div>

          {day.type === "training" ? (
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={day.workoutId ?? ""}
              onChange={(e) => {
                const workout = workouts.find((w) => w.id === e.target.value);
                updateDay(i, {
                  workoutId: e.target.value || null,
                  label: workout?.name ?? "Trening",
                });
              }}
            >
              <option value="">Izaberi trening</option>
              {workouts.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              placeholder="Napomena za dan odmora"
              value={day.restNotes ?? ""}
              onChange={(e) => updateDay(i, { restNotes: e.target.value || null })}
              className="h-8 text-sm"
            />
          )}
        </div>
      ))}

      <Button className="w-full" size="lg" onClick={saveSchedule} disabled={saving}>
        {saving ? "Čuvanje..." : "Sačuvaj raspored"}
      </Button>
    </div>
  );
}
