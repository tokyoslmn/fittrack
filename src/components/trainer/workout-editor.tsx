"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WarmupData {
  name: string;
  videoUrl: string;
  orderIndex: number;
}

interface ExerciseData {
  exerciseId: string;
  name: string;
  sets: string;
  note: string;
  videoUrl: string;
  orderIndex: number;
}

interface WorkoutData {
  name: string;
  focus: string;
  orderIndex: number;
  warmups: WarmupData[];
  exercises: ExerciseData[];
}

interface WorkoutEditorProps {
  clientId: string;
  planName: string;
  initialWorkouts: WorkoutData[];
}

export function WorkoutEditor({ clientId, planName, initialWorkouts }: WorkoutEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(planName);
  const [workouts, setWorkouts] = useState<WorkoutData[]>(initialWorkouts);

  function addWorkout() {
    setWorkouts((prev) => [
      ...prev,
      {
        name: `Trening ${String.fromCharCode(65 + prev.length)}`,
        focus: "",
        orderIndex: prev.length,
        warmups: [],
        exercises: [],
      },
    ]);
  }

  function updateWorkout(i: number, update: Partial<WorkoutData>) {
    setWorkouts((prev) => prev.map((w, idx) => (idx === i ? { ...w, ...update } : w)));
  }

  function removeWorkout(i: number) {
    setWorkouts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addWarmup(wi: number) {
    const w = workouts[wi];
    updateWorkout(wi, {
      warmups: [...w.warmups, { name: "", videoUrl: "", orderIndex: w.warmups.length }],
    });
  }

  function updateWarmup(wi: number, wui: number, update: Partial<WarmupData>) {
    const w = workouts[wi];
    updateWorkout(wi, {
      warmups: w.warmups.map((wu, i) => (i === wui ? { ...wu, ...update } : wu)),
    });
  }

  function addExercise(wi: number) {
    const w = workouts[wi];
    updateWorkout(wi, {
      exercises: [
        ...w.exercises,
        {
          exerciseId: `${String.fromCharCode(65 + w.exercises.length)}1`,
          name: "",
          sets: "2×12",
          note: "",
          videoUrl: "",
          orderIndex: w.exercises.length,
        },
      ],
    });
  }

  function updateExercise(wi: number, ei: number, update: Partial<ExerciseData>) {
    const w = workouts[wi];
    updateWorkout(wi, {
      exercises: w.exercises.map((ex, i) => (i === ei ? { ...ex, ...update } : ex)),
    });
  }

  async function savePlan() {
    setSaving(true);
    const res = await fetch("/api/trainer/workout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, name, workouts }),
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label>Naziv plana</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {workouts.map((w, wi) => (
        <div key={wi} className="rounded-xl border border-border bg-muted p-4 space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs">Naziv treninga</Label>
              <Input
                value={w.name}
                onChange={(e) => updateWorkout(wi, { name: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Fokus</Label>
              <Input
                value={w.focus}
                onChange={(e) => updateWorkout(wi, { focus: e.target.value })}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeWorkout(wi)}>
              ✕
            </Button>
          </div>

          {/* Warmups */}
          <div>
            <h4 className="text-sm font-medium text-warning mb-1.5">Aktivacije</h4>
            <div className="space-y-1.5">
              {w.warmups.map((wu, wui) => (
                <div key={wui} className="flex gap-2">
                  <Input
                    placeholder="npr. Cat-Cow 2×15"
                    value={wu.name}
                    onChange={(e) => updateWarmup(wi, wui, { name: e.target.value })}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="Video URL"
                    value={wu.videoUrl}
                    onChange={(e) => updateWarmup(wi, wui, { videoUrl: e.target.value })}
                    className="h-8 text-sm w-48"
                  />
                </div>
              ))}
              <Button variant="ghost" size="xs" onClick={() => addWarmup(wi)}>
                + Aktivacija
              </Button>
            </div>
          </div>

          {/* Exercises */}
          <div>
            <h4 className="text-sm font-medium text-primary mb-1.5">Vežbe</h4>
            <div className="space-y-2">
              {w.exercises.map((ex, ei) => (
                <div key={ei} className="flex gap-2 items-center flex-wrap">
                  <Input
                    placeholder="ID"
                    value={ex.exerciseId}
                    onChange={(e) => updateExercise(wi, ei, { exerciseId: e.target.value })}
                    className="h-8 text-sm w-14 font-mono"
                  />
                  <Input
                    placeholder="Naziv"
                    value={ex.name}
                    onChange={(e) => updateExercise(wi, ei, { name: e.target.value })}
                    className="h-8 text-sm flex-1 min-w-[140px]"
                  />
                  <Input
                    placeholder="Setovi"
                    value={ex.sets}
                    onChange={(e) => updateExercise(wi, ei, { sets: e.target.value })}
                    className="h-8 text-sm w-20 font-mono"
                  />
                  <Input
                    placeholder="Napomena"
                    value={ex.note}
                    onChange={(e) => updateExercise(wi, ei, { note: e.target.value })}
                    className="h-8 text-sm flex-1 min-w-[140px]"
                  />
                  <Input
                    placeholder="Video"
                    value={ex.videoUrl}
                    onChange={(e) => updateExercise(wi, ei, { videoUrl: e.target.value })}
                    className="h-8 text-sm w-48"
                  />
                </div>
              ))}
              <Button variant="ghost" size="xs" onClick={() => addExercise(wi)}>
                + Vežba
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addWorkout}>
        + Novi trening
      </Button>

      <Button className="w-full" size="lg" onClick={savePlan} disabled={saving}>
        {saving ? "Čuvanje..." : "Sačuvaj plan treninga"}
      </Button>
    </div>
  );
}
