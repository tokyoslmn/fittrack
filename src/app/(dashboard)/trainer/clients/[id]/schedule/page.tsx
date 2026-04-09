import { requireRole } from "@/lib/auth-utils";
import { getClientWorkoutPlan } from "@/lib/queries/trainer";
import { ScheduleEditor } from "@/components/trainer/schedule-editor";

export default async function ScheduleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TRAINER");
  const { id } = await params;
  const plan = await getClientWorkoutPlan(session.user.id, id);

  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-muted-foreground">
          Nema aktivnog plana treninga. Prvo kreiraj plan treninga.
        </p>
      </div>
    );
  }

  const initialDays = plan.schedule.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    dayName: s.dayName,
    type: s.type as "training" | "rest",
    workoutId: s.workoutId,
    label: s.label,
    restNotes: s.restNotes,
  }));

  const workoutOptions = plan.workouts.map((w) => ({
    id: w.id,
    name: w.name,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Nedeljni raspored</h1>
      <ScheduleEditor
        planId={plan.id}
        initialDays={initialDays}
        workouts={workoutOptions}
      />
    </div>
  );
}
