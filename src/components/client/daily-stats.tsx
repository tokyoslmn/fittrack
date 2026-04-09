"use client";

interface DailyStatsProps {
  waterMl: number;
  waterTargetMl: number;
  proteinConsumed: number;
  proteinTarget: number;
  kcalConsumed: number;
  kcalTarget: number;
}

export function DailyStats({
  waterMl,
  waterTargetMl,
  proteinConsumed,
  proteinTarget,
  kcalConsumed,
  kcalTarget,
}: DailyStatsProps) {
  return (
    <div className="flex gap-2">
      <StatCard
        label="Voda"
        value={`${(waterMl / 1000).toFixed(1)}L`}
        target={`/ ${(waterTargetMl / 1000).toFixed(1)}L`}
        color="text-success"
      />
      <StatCard
        label="Protein"
        value={`${proteinConsumed}g`}
        target={`/ ${proteinTarget}g`}
        color="text-secondary"
      />
      <StatCard
        label="Kalorije"
        value={`${kcalConsumed}`}
        target={`/ ${kcalTarget}`}
        color="text-warning"
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  target,
  color,
}: {
  label: string;
  value: string;
  target: string;
  color: string;
}) {
  return (
    <div className="flex-1 rounded-xl border border-border bg-muted p-2.5 text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-semibold font-mono ${color}`}>{value}</div>
      <div className="text-xs text-muted-foreground">{target}</div>
    </div>
  );
}
