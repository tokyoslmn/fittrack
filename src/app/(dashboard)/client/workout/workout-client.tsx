"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WorkoutWarmups } from "@/components/client/workout-warmups";
import { WorkoutExercises } from "@/components/client/workout-exercises";
import type { WarmupExercise, Exercise } from "@prisma/client";

interface ExerciseLogData {
  exerciseId: string;
  completed: boolean;
  weight?: number;
  reps?: string;
}

interface WorkoutPageClientProps {
  workout: {
    id: string;
    name: string;
    focus: string;
    warmups: WarmupExercise[];
    exercises: Exercise[];
  };
  alreadyCompleted: boolean;
}

export function WorkoutPageClient({ workout, alreadyCompleted }: WorkoutPageClientProps) {
  const router = useRouter();
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadyCompleted);

  const allExercisesDone = exerciseLogs.filter((l) => l.completed).length === workout.exercises.length;

  async function finishWorkout() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/client/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId: workout.id,
          exerciseLogs: exerciseLogs.map((l) => ({
            exerciseId: l.exerciseId,
            completed: l.completed,
            weight: l.weight,
            reps: l.reps,
          })),
        }),
      });

      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("sr-Latn-RS", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const totalExercises = workout.warmups.length + workout.exercises.length;
  const completedCount = exerciseLogs.filter((l) => l.completed).length;

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="text-4xl mb-4">🎉</div>
        <h1 className="text-xl font-semibold">Trening završen!</h1>
        <p className="text-muted-foreground mt-2">
          Svaka čast! {workout.name} je uspešno završen.
        </p>
        <Button className="mt-6" onClick={() => router.push("/client")}>
          Nazad na raspored
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground">{dateStr}</div>
        <div className="text-xl font-semibold mt-1">{workout.name}</div>
        <div className="text-sm text-secondary">{workout.focus}</div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(completedCount / totalExercises) * 100}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground text-center mt-1.5">
          {completedCount} / {totalExercises} završeno
        </div>
      </div>

      {/* Warmups */}
      <WorkoutWarmups warmups={workout.warmups} />

      {/* Exercises */}
      <WorkoutExercises
        exercises={workout.exercises}
        onLogsChange={setExerciseLogs}
      />

      {/* Finish button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!allExercisesDone || submitting}
        onClick={finishWorkout}
      >
        {submitting ? "Čuvanje..." : "Završi trening"}
      </Button>
      {!allExercisesDone && (
        <p className="text-xs text-muted-foreground text-center">
          Završi sve vežbe da aktiviraš dugme
        </p>
      )}
    </div>
  );
}
