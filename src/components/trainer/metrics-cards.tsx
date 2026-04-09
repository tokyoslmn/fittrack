interface MetricsCardsProps {
  weight: number | null;
  bmi: number | null;
  bodyFatPct: number | null;
  workoutsThisWeek: number;
  trainingDaysPerWeek: number;
}

export function MetricsCards({
  weight,
  bmi,
  bodyFatPct,
  workoutsThisWeek,
  trainingDaysPerWeek,
}: MetricsCardsProps) {
  const cards = [
    { label: "Težina", value: weight ? `${weight} kg` : "—", color: "text-foreground" },
    { label: "BMI", value: bmi ? bmi.toFixed(1) : "—", color: "text-foreground" },
    { label: "Mast", value: bodyFatPct ? `${bodyFatPct}%` : "—", color: "text-warning" },
    {
      label: "Treninzi",
      value: `${workoutsThisWeek}/${trainingDaysPerWeek}`,
      color: workoutsThisWeek >= trainingDaysPerWeek ? "text-success" : "text-danger",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border bg-muted p-3 text-center"
        >
          <div className="text-xs text-muted-foreground">{card.label}</div>
          <div className={`text-xl font-semibold font-mono mt-1 ${card.color}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
