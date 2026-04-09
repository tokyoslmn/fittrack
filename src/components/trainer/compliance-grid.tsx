const DAY_NAMES = ["Pon", "Uto", "Sre", "Čet", "Pet", "Sub", "Ned"];

interface ComplianceDay {
  date: Date;
  workout: boolean | null; // null = rest day
  water: boolean;
  supplements: boolean;
}

interface ComplianceGridProps {
  days: ComplianceDay[];
}

export function ComplianceGrid({ days }: ComplianceGridProps) {
  return (
    <div className="rounded-xl border border-border bg-muted p-4">
      <h3 className="font-semibold mb-3">Nedeljni pregled</h3>
      <div className="grid grid-cols-7 gap-2">
        {DAY_NAMES.map((name) => (
          <div key={name} className="text-center text-xs text-muted-foreground">
            {name}
          </div>
        ))}
        {days.map((day, i) => (
          <div key={i} className="space-y-1">
            {day.workout !== null && (
              <Dot ok={day.workout} label="T" />
            )}
            <Dot ok={day.water} label="V" />
            <Dot ok={day.supplements} label="S" />
          </div>
        ))}
      </div>
      <div className="flex gap-4 mt-3 text-xs text-muted-foreground">
        <span>T = Trening</span>
        <span>V = Voda</span>
        <span>S = Suplementi</span>
      </div>
    </div>
  );
}

function Dot({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center justify-center">
      <div
        className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
          ok
            ? "bg-success/20 text-success"
            : "bg-danger/20 text-danger"
        }`}
      >
        {label}
      </div>
    </div>
  );
}
