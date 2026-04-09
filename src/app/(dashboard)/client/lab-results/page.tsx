import { requireRole } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export default async function LabResultsPage() {
  const session = await requireRole("CLIENT");

  const labResults = await prisma.labResult.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    include: { items: true },
  });

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-semibold">🔬 Laboratorijski rezultati</h1>

      {labResults.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nema unetih rezultata.</p>
      ) : (
        labResults.map((result) => (
          <div
            key={result.id}
            className="rounded-xl border border-border bg-muted p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  {result.labName ?? "Laboratorija"}
                </div>
                <div className="text-xs text-muted-foreground">
                  {new Date(result.date).toLocaleDateString("sr-Latn-RS")}
                  {result.protocolNum && ` · Protokol: ${result.protocolNum}`}
                </div>
              </div>
            </div>

            {result.notes && (
              <p className="text-sm text-muted-foreground italic">
                {result.notes}
              </p>
            )}

            {/* Group items by category */}
            {Object.entries(
              result.items.reduce<Record<string, typeof result.items>>(
                (groups, item) => {
                  const cat = item.category;
                  if (!groups[cat]) groups[cat] = [];
                  groups[cat].push(item);
                  return groups;
                },
                {}
              )
            ).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-medium text-primary mb-1.5">
                  {category}
                </h3>
                <div className="space-y-1">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <span>{item.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono">
                          {item.value} {item.unit}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({item.refRange})
                        </span>
                        <span
                          className={`h-2 w-2 rounded-full ${
                            item.status === "ok"
                              ? "bg-success"
                              : item.status === "high"
                                ? "bg-danger"
                                : item.status === "low"
                                  ? "bg-primary"
                                  : "bg-warning"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
