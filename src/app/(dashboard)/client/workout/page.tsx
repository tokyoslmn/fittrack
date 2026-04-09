import { requireRole } from "@/lib/auth-utils";
import { getTodayWorkout } from "@/lib/queries/workout";
import { WorkoutPageClient } from "./workout-client";

export default async function WorkoutPage() {
  const session = await requireRole("CLIENT");
  const data = await getTodayWorkout(session.user.id);

  if (!data) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="text-4xl mb-4">🌿</div>
        <h1 className="text-xl font-semibold">Dan odmora</h1>
        <p className="text-muted-foreground mt-2">
          Danas nema treninga. Uživaj u odmoru i šetnji!
        </p>
      </div>
    );
  }

  // Serialize for client component
  const workout = {
    id: data.workout.id,
    name: data.workout.name,
    focus: data.workout.focus,
    warmups: data.workout.warmups,
    exercises: data.workout.exercises,
  };

  const alreadyCompleted = data.existingLog?.completed ?? false;

  return (
    <WorkoutPageClient
      workout={workout}
      alreadyCompleted={alreadyCompleted}
    />
  );
}
