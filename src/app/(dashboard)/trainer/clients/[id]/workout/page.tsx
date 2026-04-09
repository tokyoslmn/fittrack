import { requireRole } from "@/lib/auth-utils";
import { getClientWorkoutPlan } from "@/lib/queries/trainer";
import { WorkoutEditor } from "@/components/trainer/workout-editor";

export default async function WorkoutEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TRAINER");
  const { id } = await params;
  const plan = await getClientWorkoutPlan(session.user.id, id);

  const initialWorkouts = plan
    ? plan.workouts.map((w) => ({
        name: w.name,
        focus: w.focus,
        orderIndex: w.orderIndex,
        warmups: w.warmups.map((wu) => ({
          name: wu.name,
          videoUrl: wu.videoUrl ?? "",
          orderIndex: wu.orderIndex,
        })),
        exercises: w.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: ex.sets,
          note: ex.note ?? "",
          videoUrl: ex.videoUrl ?? "",
          orderIndex: ex.orderIndex,
        })),
      }))
    : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Plan treninga</h1>
      <WorkoutEditor
        clientId={id}
        planName={plan?.name ?? ""}
        initialWorkouts={initialWorkouts}
      />
    </div>
  );
}
