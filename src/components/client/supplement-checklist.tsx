"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Supplement {
  id: string;
  name: string;
  dose: string;
  timing: string;
  icon: string | null;
}

interface SupplementChecklistProps {
  supplements: Supplement[];
  initialLogs: { supplementName: string; taken: boolean }[];
}

export function SupplementChecklist({
  supplements,
  initialLogs,
}: SupplementChecklistProps) {
  const router = useRouter();
  const [takenMap, setTakenMap] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const log of initialLogs) {
      map[log.supplementName] = log.taken;
    }
    return map;
  });

  async function toggle(name: string) {
    const newVal = !takenMap[name];
    setTakenMap((prev) => ({ ...prev, [name]: newVal }));

    await fetch("/api/client/supplement", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplementName: name, taken: newVal }),
    });

    router.refresh();
  }

  return (
    <div className="space-y-2">
      {supplements.map((sup) => {
        const taken = takenMap[sup.name] ?? false;
        return (
          <div
            key={sup.id}
            className={`flex items-center gap-3 rounded-xl border p-3 cursor-pointer transition-all ${
              taken
                ? "border-primary/20 bg-primary/5"
                : "border-border bg-muted"
            }`}
            onClick={() => toggle(sup.name)}
          >
            <div
              className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs ${
                taken
                  ? "bg-primary/20 border-primary text-primary"
                  : "border-border"
              }`}
            >
              {taken && "✓"}
            </div>
            <div className="flex-1">
              <div className="font-medium">
                {sup.icon && <span className="mr-1">{sup.icon}</span>}
                {sup.name}
              </div>
              <div className="text-xs text-muted-foreground">
                {sup.dose} — {sup.timing}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
