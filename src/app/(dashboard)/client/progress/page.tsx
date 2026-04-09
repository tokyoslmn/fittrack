import { requireRole } from "@/lib/auth-utils";
import { getWeightHistory, getBodyCompHistory } from "@/lib/queries/logs";

export default async function ProgressPage() {
  const session = await requireRole("CLIENT");
  const [weightHistory, bodyCompHistory] = await Promise.all([
    getWeightHistory(session.user.id, 20),
    getBodyCompHistory(session.user.id, 10),
  ]);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-semibold">📈 Moj napredak</h1>

      {/* Weight trend */}
      <div className="rounded-xl border border-border bg-muted p-4">
        <h2 className="font-semibold mb-3">Težina</h2>
        {weightHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nema unosa.</p>
        ) : (
          <div className="space-y-1.5">
            {weightHistory.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {new Date(log.date).toLocaleDateString("sr-Latn-RS")}
                </span>
                <span className="font-mono font-semibold">
                  {log.weight} kg
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Body composition trend */}
      <div className="rounded-xl border border-border bg-muted p-4">
        <h2 className="font-semibold mb-3">Telesna kompozicija</h2>
        {bodyCompHistory.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nema unosa.</p>
        ) : (
          <div className="space-y-3">
            {bodyCompHistory.map((log) => (
              <div key={log.id}>
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span>
                    {new Date(log.date).toLocaleDateString("sr-Latn-RS")}
                  </span>
                  {log.weight && (
                    <span className="font-mono">{log.weight} kg</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1 mt-1 text-xs text-muted-foreground">
                  {log.bodyFatPct != null && <div>Mast: {log.bodyFatPct}%</div>}
                  {log.muscleMass != null && (
                    <div>Mišići: {log.muscleMass} kg</div>
                  )}
                  {log.visceralFat != null && (
                    <div>Visc: {log.visceralFat}</div>
                  )}
                  {log.bmi != null && <div>BMI: {log.bmi}</div>}
                  {log.bmr != null && <div>BMR: {log.bmr} kcal</div>}
                  {log.bodyWater != null && <div>Voda: {log.bodyWater}%</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
