import { requireRole } from "@/lib/auth-utils";
import { getWeightHistory } from "@/lib/queries/logs";
import { WeightForm } from "@/components/client/weight-form";

export default async function WeightPage() {
  const session = await requireRole("CLIENT");
  const history = await getWeightHistory(session.user.id);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-semibold">⚖️ Težina</h1>

      <div className="rounded-xl border border-border bg-muted p-4">
        <WeightForm />
      </div>

      {/* History */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3">
          Istorija
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nema unosa.</p>
        ) : (
          <div className="space-y-2">
            {history.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted p-3"
              >
                <div>
                  <div className="font-mono text-lg font-semibold">
                    {log.weight} kg
                  </div>
                  {log.note && (
                    <div className="text-xs text-muted-foreground">{log.note}</div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(log.date).toLocaleDateString("sr-Latn-RS")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
