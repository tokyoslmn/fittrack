import Link from "next/link";

interface ClientCardProps {
  id: string;
  name: string;
  email: string;
  currentWeight: number | null;
  workoutsThisWeek: number;
}

export function ClientCard({
  id,
  name,
  email,
  currentWeight,
  workoutsThisWeek,
}: ClientCardProps) {
  return (
    <Link href={`/trainer/clients/${id}`}>
      <div className="rounded-xl border border-border bg-muted p-4 hover:bg-accent transition-colors cursor-pointer">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-semibold text-lg">{name}</div>
            <div className="text-sm text-muted-foreground">{email}</div>
          </div>
          <div className="text-right">
            {currentWeight && (
              <div className="font-mono text-lg">{currentWeight} kg</div>
            )}
            <div className="text-xs text-muted-foreground">
              {workoutsThisWeek} treninga ove nedelje
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
