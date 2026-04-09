import { requireRole } from "@/lib/auth-utils";
import { getSupplementPlan, getTodaySupplementLogs } from "@/lib/queries/logs";
import { SupplementChecklist } from "@/components/client/supplement-checklist";

export default async function SupplementsPage() {
  const session = await requireRole("CLIENT");
  const [supplements, logs] = await Promise.all([
    getSupplementPlan(session.user.id),
    getTodaySupplementLogs(session.user.id),
  ]);

  const takenCount = logs.filter((l) => l.taken).length;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Suplementi</h1>
        <span className="text-sm text-muted-foreground">
          {takenCount}/{supplements.length}
        </span>
      </div>

      {supplements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nema definisanih suplemenata u planu.
        </p>
      ) : (
        <SupplementChecklist
          supplements={supplements}
          initialLogs={logs}
        />
      )}
    </div>
  );
}
