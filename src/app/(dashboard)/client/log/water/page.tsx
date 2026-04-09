import { requireRole } from "@/lib/auth-utils";
import { getTodayWaterLogs } from "@/lib/queries/logs";
import { WaterTracker } from "@/components/client/water-tracker";

export default async function WaterPage() {
  const session = await requireRole("CLIENT");
  const waterLogs = await getTodayWaterLogs(session.user.id);

  const totalMl = waterLogs.reduce((sum, l) => sum + l.amountMl, 0);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-semibold">💧 Voda</h1>

      <div className="rounded-xl border border-border bg-muted p-4">
        <WaterTracker totalMl={totalMl} targetMl={3500} />
      </div>

      {/* Today's entries */}
      {waterLogs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Današnji unosi
          </h2>
          <div className="space-y-1.5">
            {waterLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted p-2.5 text-sm"
              >
                <span className="font-mono">{log.amountMl} mL</span>
                <span className="text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
