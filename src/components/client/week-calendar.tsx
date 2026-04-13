"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface WeekDay {
  date: string;
  dateStr: string;
  dayName: string;
  dayOfWeek: number;
  isTrainingDay: boolean;
  workout: {
    name: string;
    focus: string;
    warmups: { name: string; videoUrl: string | null }[];
    exercises: {
      exerciseId: string;
      name: string;
      sets: string;
      note: string | null;
      videoUrl: string | null;
    }[];
  } | null;
  label: string;
  restNotes: string | null;
  meals: {
    id: string;
    name: string;
    time: string;
    protein: number;
    carbs: number;
    fat: number;
    icon: string | null;
    options: {
      optionNumber: number;
      description: string;
      items: {
        id: string;
        quantity: number;
        foodItem: {
          name: string;
          protein: number;
          carbs: number;
          fat: number;
          calories: number;
          measuredRaw: boolean;
        };
      }[];
    }[];
  }[];
  status: {
    water: boolean;
    waterMl: number;
    supplements: boolean;
    supplementCount: number;
    supplementTotal: number;
    workout: boolean | null;
  };
}

interface WeekCalendarProps {
  initialDays: WeekDay[];
  initialOffset: number;
}

function isTodayDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isPastDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function StatusDot({
  done,
  isPast,
  label,
}: {
  done: boolean | null;
  isPast: boolean;
  label: string;
}) {
  if (done === null) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30" />
        {label}
      </span>
    );
  }
  if (!isPast && !done) {
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="inline-block h-2 w-2 rounded-full bg-muted-foreground/30" />
        {label}
      </span>
    );
  }
  return (
    <span
      className={cn(
        "flex items-center gap-1 text-xs",
        done ? "text-success" : "text-destructive"
      )}
    >
      <span
        className={cn(
          "inline-block h-2 w-2 rounded-full",
          done ? "bg-success" : "bg-destructive"
        )}
      />
      {label}
    </span>
  );
}

function DayCard({
  day,
  isExpanded,
  onToggle,
}: {
  day: WeekDay;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isToday = isTodayDate(day.date);
  const isPast = isPastDate(day.date);

  return (
    <div
      className={cn(
        "rounded-xl border p-3 flex flex-col gap-2 cursor-pointer transition-colors hover:bg-accent/50",
        isToday
          ? "border-primary/50 bg-primary/10"
          : "border-border bg-muted"
      )}
      onClick={onToggle}
    >
      {/* Day header */}
      <div className="flex items-center justify-between">
        <div>
          <div className={cn("text-xs font-semibold", isToday ? "text-primary" : "text-foreground")}>
            {day.dayName}
          </div>
          <div className="text-xs font-mono text-muted-foreground">{day.dateStr}</div>
        </div>
        <div className="flex items-center gap-1">
          {day.isTrainingDay ? (
            <span className="text-sm" title="Dan treninga">🏋️</span>
          ) : (
            <span className="text-sm" title="Dan odmora">🌿</span>
          )}
          {isToday && (
            <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground leading-none">
              Danas
            </span>
          )}
        </div>
      </div>

      {/* Workout name */}
      {day.isTrainingDay && day.workout && (
        <div className="text-xs text-primary font-medium truncate">{day.workout.name}</div>
      )}
      {!day.isTrainingDay && (
        <div className="text-xs text-muted-foreground">{day.label}</div>
      )}

      {/* Meals summary */}
      {day.meals.length > 0 && (
        <div className="flex flex-col gap-0.5">
          {day.meals.slice(0, isExpanded ? undefined : 3).map((meal) => (
            <div key={meal.id} className="flex items-center gap-1 text-xs text-muted-foreground">
              <span className="font-mono">{meal.time}</span>
              <span className="truncate">{meal.icon ?? "🍽️"} {meal.name}</span>
            </div>
          ))}
          {!isExpanded && day.meals.length > 3 && (
            <div className="text-xs text-muted-foreground">
              +{day.meals.length - 3} još...
            </div>
          )}
        </div>
      )}

      {/* Expanded meal details */}
      {isExpanded && day.meals.length > 0 && (
        <div className="flex flex-col gap-2 mt-1 border-t border-border pt-2">
          {day.meals.map((meal) => (
            <div key={meal.id} className="rounded-lg border border-border bg-card p-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {meal.icon ?? "🍽️"} {meal.name}
                </span>
                <span className="text-xs font-mono text-muted-foreground">{meal.time}</span>
              </div>
              <div className="mt-1 flex gap-2 text-xs font-mono">
                <span className="text-secondary">P: {meal.protein}g</span>
                <span className="text-warning">C: {meal.carbs}g</span>
                <span className="text-success">F: {meal.fat}g</span>
              </div>
              {meal.options.length > 0 && (
                <div className="mt-1.5 space-y-1">
                  {meal.options.map((opt) => (
                    <div key={opt.optionNumber}>
                      <span className="text-xs text-primary">Opcija {opt.optionNumber}:</span>
                      {opt.items && opt.items.length > 0 ? (
                        <div className="text-xs text-muted-foreground mt-0.5 rounded bg-muted p-1.5 space-y-0.5">
                          {opt.items.map((item) => {
                            const factor = item.quantity / 100;
                            return (
                              <div key={item.id} className="flex justify-between">
                                <span>{item.quantity}g {item.foodItem.name}</span>
                                <span className="font-mono">
                                  P:{Math.round(item.foodItem.protein * factor)}
                                  {" "}C:{Math.round(item.foodItem.carbs * factor)}
                                  {" "}F:{Math.round(item.foodItem.fat * factor)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground mt-0.5 rounded bg-muted p-1.5">
                          {opt.description}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Rest notes expanded */}
      {isExpanded && !day.isTrainingDay && day.restNotes && (
        <div className="text-xs text-muted-foreground border-t border-border pt-2 mt-1">
          {day.restNotes}
        </div>
      )}

      {/* Workout details expanded */}
      {isExpanded && day.isTrainingDay && day.workout && (
        <div className="text-xs border-t border-border pt-2 mt-1 space-y-2">
          {day.workout.focus && (
            <div className="text-muted-foreground">Fokus: {day.workout.focus}</div>
          )}

          {/* Warmups */}
          {day.workout.warmups?.length > 0 && (
            <div>
              <div className="font-semibold text-muted-foreground mb-1">Zagrevanje</div>
              <div className="space-y-0.5">
                {day.workout.warmups.map((w, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-muted-foreground">
                    <span>{w.name}</span>
                    {w.videoUrl && (
                      <a
                        href={w.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        ▶ Video
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exercises */}
          {day.workout.exercises?.length > 0 && (
            <div>
              <div className="font-semibold text-muted-foreground mb-1">Vežbe</div>
              <div className="space-y-1">
                {day.workout.exercises.map((ex) => (
                  <div key={ex.exerciseId} className="flex flex-col gap-0.5 rounded-lg border border-border bg-card p-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-primary font-semibold">{ex.exerciseId}</span>
                      <span className="text-foreground">{ex.name}</span>
                      <span className="font-mono text-muted-foreground ml-auto shrink-0">{ex.sets}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {ex.note && (
                        <span className="text-muted-foreground italic">{ex.note}</span>
                      )}
                      {ex.videoUrl && (
                        <a
                          href={ex.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline ml-auto shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          ▶ Video
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Status indicators */}
      <div className="flex flex-wrap gap-2 border-t border-border pt-2 mt-auto">
        <StatusDot
          done={day.status.water}
          isPast={isPast || isToday}
          label={`💧 ${Math.round(day.status.waterMl / 100) / 10}L`}
        />
        <StatusDot
          done={day.status.supplements ? day.status.supplementCount > 0 : false}
          isPast={isPast || isToday}
          label={`💊 ${day.status.supplementCount}/${day.status.supplementTotal}`}
        />
        {day.status.workout !== null && (
          <StatusDot
            done={day.status.workout}
            isPast={isPast || isToday}
            label="🏋️ Trening"
          />
        )}
      </div>
    </div>
  );
}

export function WeekCalendar({ initialDays, initialOffset }: WeekCalendarProps) {
  const [offset, setOffset] = useState(initialOffset);
  const [days, setDays] = useState<WeekDay[]>(initialDays);
  const [loading, setLoading] = useState(false);
  const [collapsedDays, setCollapsedDays] = useState<Set<number>>(new Set());

  async function fetchWeek(newOffset: number) {
    setLoading(true);
    try {
      const res = await fetch(`/api/client/schedule?offset=${newOffset}`);
      if (res.ok) {
        const data = await res.json();
        setDays(data.days);
        setOffset(newOffset);
        setCollapsedDays(new Set());
      }
    } finally {
      setLoading(false);
    }
  }

  const weekStart = days[0] ? new Date(days[0].date) : new Date();
  const weekEnd = days[6] ? new Date(days[6].date) : new Date();
  const weekLabel = `${weekStart.toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit" })} – ${weekEnd.toLocaleDateString("sr-Latn-RS", { day: "2-digit", month: "2-digit", year: "numeric" })}`;

  return (
    <div className="space-y-4">
      {/* Navigation */}
      <div className="flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchWeek(offset - 1)}
          disabled={loading}
        >
          ← Prethodna
        </Button>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm font-medium">{weekLabel}</span>
          {offset !== 0 && (
            <button
              className="text-xs text-primary underline-offset-2 hover:underline"
              onClick={() => fetchWeek(0)}
              disabled={loading}
            >
              Ova nedelja
            </button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchWeek(offset + 1)}
          disabled={loading}
        >
          Sledeća →
        </Button>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="text-center text-sm text-muted-foreground py-4">
          Učitavanje...
        </div>
      )}

      {/* 7-day grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {days.map((day, i) => (
            <DayCard
              key={day.date}
              day={day}
              isExpanded={!collapsedDays.has(i)}
              onToggle={() => setCollapsedDays((prev) => {
                const next = new Set(prev);
                if (next.has(i)) next.delete(i);
                else next.add(i);
                return next;
              })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
