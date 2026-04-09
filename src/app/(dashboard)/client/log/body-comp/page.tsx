import { requireRole } from "@/lib/auth-utils";
import { getBodyCompHistory } from "@/lib/queries/logs";
import { BodyCompForm } from "@/components/client/body-comp-form";

export default async function BodyCompPage() {
  const session = await requireRole("CLIENT");
  const history = await getBodyCompHistory(session.user.id);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-semibold">Telesna kompozicija</h1>

      <div className="rounded-xl border border-border bg-muted p-4">
        <BodyCompForm />
      </div>

      {history.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Istorija
          </h2>
          <div className="space-y-2">
            {history.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-border bg-muted p-3"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">
                    {new Date(log.date).toLocaleDateString("sr-Latn-RS")}
                  </span>
                  {log.weight && (
                    <span className="font-mono">{log.weight} kg</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs text-muted-foreground">
                  {log.bodyFatPct != null && <div>Mast: {log.bodyFatPct}%</div>}
                  {log.muscleMass != null && <div>Mišići: {log.muscleMass} kg</div>}
                  {log.visceralFat != null && <div>Visc. mast: {log.visceralFat}</div>}
                  {log.bmi != null && <div>BMI: {log.bmi}</div>}
                  {log.bmr != null && <div>BMR: {log.bmr} kcal</div>}
                  {log.bodyWater != null && <div>Voda: {log.bodyWater}%</div>}
                </div>
                {log.note && (
                  <div className="text-xs text-muted-foreground mt-1.5 italic">
                    {log.note}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
