# Client Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all client-facing pages — today's schedule (main page), guided workout, nutrition view, and all logging pages (weight, water, food, supplements, body composition).

**Architecture:** Server Components fetch data via Prisma for reads. Client Components handle interactive forms and submit to API Route Handlers for writes. Each page uses `requireRole("CLIENT")` for auth. Data utilities in `src/lib/queries/` encapsulate common Prisma queries. API routes in `src/app/api/client/` handle all write operations with zod validation.

**Tech Stack:** Next.js 16, Prisma 7 (PrismaPg adapter), Auth.js v5, Tailwind CSS, shadcn/ui (base-nova), zod, react-hook-form

---

## File Structure

```
src/
├── lib/
│   └── queries/
│       ├── schedule.ts        # Today's schedule data (meals, workout, supplements)
│       ├── workout.ts         # Workout details with warmups/exercises
│       └── logs.ts            # Weight, water, body-comp log queries
├── app/
│   ├── api/client/
│   │   ├── water/route.ts     # POST water log
│   │   ├── weight/route.ts    # POST weight log
│   │   ├── meal/route.ts      # POST meal log
│   │   ├── supplement/route.ts # POST supplement log
│   │   ├── body-comp/route.ts # POST body composition log
│   │   ├── workout/route.ts   # POST workout log (complete workout)
│   │   └── daily/route.ts     # PATCH daily log (steps, notes)
│   └── (dashboard)/client/
│       ├── page.tsx                    # Today's schedule (MAIN page)
│       ├── workout/page.tsx            # Guided workout
│       ├── nutrition/page.tsx          # Today's meals expanded
│       └── log/
│           ├── weight/page.tsx         # Weight logging + history
│           ├── water/page.tsx          # Water intake tracking
│           ├── food/page.tsx           # Food diary
│           ├── supplements/page.tsx    # Supplement checklist
│           └── body-comp/page.tsx      # Body composition entry
└── components/client/
    ├── schedule-timeline.tsx   # Timeline component for today's page
    ├── daily-stats.tsx         # Quick stats bar (water, protein, kcal)
    ├── daily-goals.tsx         # Daily completion checkboxes
    ├── quick-actions.tsx       # + Water, + Meal, + Weight buttons
    ├── workout-warmups.tsx     # Warmup exercise list with checkboxes
    ├── workout-exercises.tsx   # Main exercises with logging inputs
    ├── water-tracker.tsx       # Water increment buttons + progress
    ├── weight-form.tsx         # Weight entry form
    ├── meal-log-form.tsx       # Meal diary entry form
    ├── supplement-checklist.tsx # Supplement toggle list
    └── body-comp-form.tsx      # Body composition entry form
```

---

### Task 1: Data Query Utilities

**Files:**
- Create: `src/lib/queries/schedule.ts`
- Create: `src/lib/queries/workout.ts`
- Create: `src/lib/queries/logs.ts`

- [ ] **Step 1: Create schedule queries**

Create `src/lib/queries/schedule.ts`:

```typescript
import { prisma } from "@/lib/prisma";

export async function getTodaySchedule(userId: string) {
  // Get day of week (0=Monday in our schema, JS Date: 0=Sunday)
  const now = new Date();
  const jsDay = now.getDay(); // 0=Sun, 1=Mon...6=Sat
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Mon...6=Sun

  // Find active plans for this client
  const nutritionPlan = await prisma.nutritionPlan.findFirst({
    where: { clientId: userId, active: true },
    include: {
      meals: {
        include: { options: { orderBy: { optionNumber: "asc" } } },
        orderBy: { orderIndex: "asc" },
      },
      supplements: true,
    },
  });

  const workoutPlan = await prisma.workoutPlan.findFirst({
    where: { clientId: userId, active: true },
    include: {
      schedule: {
        where: { dayOfWeek },
        include: { workout: true },
      },
    },
  });

  const todaySchedule = workoutPlan?.schedule[0] ?? null;
  const isTrainingDay = todaySchedule?.type === "training";

  // Filter meals for training/rest day
  const meals = nutritionPlan?.meals.filter(
    (m) => m.isTrainingDay === isTrainingDay
  ) ?? [];

  // Get today's logs
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [dailyLog, waterLogs, supplementLogs, workoutLog] = await Promise.all([
    prisma.dailyLog.findUnique({
      where: { userId_date: { userId, date: todayStart } },
    }),
    prisma.waterLog.findMany({
      where: { userId, date: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.supplementLog.findMany({
      where: { userId, date: { gte: todayStart, lt: todayEnd } },
    }),
    prisma.workoutLog.findFirst({
      where: { userId, date: { gte: todayStart, lt: todayEnd } },
    }),
  ]);

  const totalWaterMl = waterLogs.reduce((sum, l) => sum + l.amountMl, 0);

  return {
    isTrainingDay,
    todaySchedule,
    meals,
    supplements: nutritionPlan?.supplements ?? [],
    nutritionPlan,
    dailyLog,
    totalWaterMl,
    supplementLogs,
    workoutCompleted: workoutLog?.completed ?? false,
  };
}
```

- [ ] **Step 2: Create workout queries**

Create `src/lib/queries/workout.ts`:

```typescript
import { prisma } from "@/lib/prisma";

export async function getTodayWorkout(userId: string) {
  const now = new Date();
  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;

  const workoutPlan = await prisma.workoutPlan.findFirst({
    where: { clientId: userId, active: true },
    include: {
      schedule: {
        where: { dayOfWeek },
        include: {
          workout: {
            include: {
              warmups: { orderBy: { orderIndex: "asc" } },
              exercises: { orderBy: { orderIndex: "asc" } },
            },
          },
        },
      },
    },
  });

  const schedule = workoutPlan?.schedule[0];
  if (!schedule || schedule.type !== "training" || !schedule.workout) {
    return null;
  }

  // Check for existing workout log today
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const existingLog = await prisma.workoutLog.findFirst({
    where: { userId, date: { gte: todayStart, lt: todayEnd } },
    include: { exerciseLogs: true },
  });

  return {
    workout: schedule.workout,
    schedule,
    existingLog,
  };
}
```

- [ ] **Step 3: Create log queries**

Create `src/lib/queries/logs.ts`:

```typescript
import { prisma } from "@/lib/prisma";

export async function getWeightHistory(userId: string, limit = 30) {
  return prisma.weightLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getBodyCompHistory(userId: string, limit = 10) {
  return prisma.bodyCompositionLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getTodayWaterLogs(userId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  return prisma.waterLog.findMany({
    where: { userId, date: { gte: todayStart, lt: todayEnd } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTodayMealLogs(userId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  return prisma.mealLog.findMany({
    where: { userId, date: { gte: todayStart, lt: todayEnd } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSupplementPlan(userId: string) {
  const plan = await prisma.nutritionPlan.findFirst({
    where: { clientId: userId, active: true },
    include: { supplements: true },
  });
  return plan?.supplements ?? [];
}

export async function getTodaySupplementLogs(userId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  return prisma.supplementLog.findMany({
    where: { userId, date: { gte: todayStart, lt: todayEnd } },
  });
}
```

- [ ] **Step 4: Verify imports compile**

```bash
pnpm build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/queries/
git commit -m "feat: data query utilities for client schedule, workout, and logs"
```

---

### Task 2: Client API Routes

**Files:**
- Create: `src/app/api/client/water/route.ts`
- Create: `src/app/api/client/weight/route.ts`
- Create: `src/app/api/client/meal/route.ts`
- Create: `src/app/api/client/supplement/route.ts`
- Create: `src/app/api/client/body-comp/route.ts`
- Create: `src/app/api/client/workout/route.ts`

- [ ] **Step 1: Create water log API**

Create `src/app/api/client/water/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const waterSchema = z.object({
  amountMl: z.number().int().positive().max(5000),
  time: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amountMl, time } = waterSchema.parse(body);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const log = await prisma.waterLog.create({
      data: {
        userId: session.user.id,
        date: todayStart,
        amountMl,
        time: time ?? now.toTimeString().slice(0, 5),
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create weight log API**

Create `src/app/api/client/weight/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const weightSchema = z.object({
  weight: z.number().positive().max(500),
  note: z.string().optional(),
  date: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { weight, note, date } = weightSchema.parse(body);

    const logDate = date ? new Date(date) : new Date();
    const dateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());

    const log = await prisma.weightLog.create({
      data: {
        userId: session.user.id,
        date: dateOnly,
        weight,
        note: note || null,
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Create meal log API**

Create `src/app/api/client/meal/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const mealSchema = z.object({
  mealName: z.string().min(1),
  description: z.string().min(1),
  time: z.string().optional(),
  onPlan: z.boolean().default(true),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = mealSchema.parse(body);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const log = await prisma.mealLog.create({
      data: {
        userId: session.user.id,
        date: todayStart,
        mealName: data.mealName,
        description: data.description,
        time: data.time ?? now.toTimeString().slice(0, 5),
        onPlan: data.onPlan,
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

- [ ] **Step 4: Create supplement log API**

Create `src/app/api/client/supplement/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const supplementSchema = z.object({
  supplementName: z.string().min(1),
  taken: z.boolean(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { supplementName, taken } = supplementSchema.parse(body);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Upsert: find existing log for this supplement today, or create new
    const existing = await prisma.supplementLog.findFirst({
      where: {
        userId: session.user.id,
        date: todayStart,
        supplementName,
      },
    });

    let log;
    if (existing) {
      log = await prisma.supplementLog.update({
        where: { id: existing.id },
        data: { taken },
      });
    } else {
      log = await prisma.supplementLog.create({
        data: {
          userId: session.user.id,
          date: todayStart,
          supplementName,
          taken,
        },
      });
    }

    return NextResponse.json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

- [ ] **Step 5: Create body composition log API**

Create `src/app/api/client/body-comp/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodyCompSchema = z.object({
  weight: z.number().positive().optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  fatMass: z.number().positive().optional(),
  muscleMass: z.number().positive().optional(),
  musclePct: z.number().min(0).max(100).optional(),
  skeletalMuscle: z.number().positive().optional(),
  bodyWater: z.number().min(0).max(100).optional(),
  visceralFat: z.number().min(0).optional(),
  bmr: z.number().int().positive().optional(),
  bmi: z.number().positive().optional(),
  waistHip: z.number().positive().optional(),
  heartRate: z.number().int().positive().optional(),
  note: z.string().optional(),
  date: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = bodyCompSchema.parse(body);

    const logDate = data.date ? new Date(data.date) : new Date();
    const dateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());

    const log = await prisma.bodyCompositionLog.create({
      data: {
        userId: session.user.id,
        date: dateOnly,
        weight: data.weight,
        bodyFatPct: data.bodyFatPct,
        fatMass: data.fatMass,
        muscleMass: data.muscleMass,
        musclePct: data.musclePct,
        skeletalMuscle: data.skeletalMuscle,
        bodyWater: data.bodyWater,
        visceralFat: data.visceralFat,
        bmr: data.bmr,
        bmi: data.bmi,
        waistHip: data.waistHip,
        heartRate: data.heartRate,
        note: data.note || null,
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

- [ ] **Step 6: Create workout completion API**

Create `src/app/api/client/workout/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const exerciseLogSchema = z.object({
  exerciseId: z.string(),
  completed: z.boolean(),
  weight: z.number().optional(),
  reps: z.string().optional(),
  notes: z.string().optional(),
});

const workoutSchema = z.object({
  workoutId: z.string(),
  duration: z.number().int().optional(),
  notes: z.string().optional(),
  exerciseLogs: z.array(exerciseLogSchema),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = workoutSchema.parse(body);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const log = await prisma.workoutLog.create({
      data: {
        userId: session.user.id,
        date: todayStart,
        workoutId: data.workoutId,
        completed: true,
        duration: data.duration,
        notes: data.notes,
        exerciseLogs: {
          create: data.exerciseLogs.map((e) => ({
            exerciseId: e.exerciseId,
            completed: e.completed,
            weight: e.weight,
            reps: e.reps,
            notes: e.notes,
          })),
        },
      },
      include: { exerciseLogs: true },
    });

    return NextResponse.json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

- [ ] **Step 7: Verify build**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 8: Commit**

```bash
git add src/app/api/client/
git commit -m "feat: client API routes for water, weight, meal, supplement, body-comp, and workout logging"
```

---

### Task 3: Today's Schedule Page (Main Client Page)

**Files:**
- Create: `src/components/client/schedule-timeline.tsx`
- Create: `src/components/client/daily-stats.tsx`
- Create: `src/components/client/daily-goals.tsx`
- Create: `src/components/client/quick-actions.tsx`
- Modify: `src/app/(dashboard)/client/page.tsx`

This is the most important page — the client's daily hub showing timeline, meals, workout, water, supplements, and daily goals.

- [ ] **Step 1: Create daily stats bar component**

Create `src/components/client/daily-stats.tsx`:

```tsx
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
```

- [ ] **Step 2: Create schedule timeline component**

Create `src/components/client/schedule-timeline.tsx`:

```tsx
import Link from "next/link";
import type { Meal, MealOption, SupplementPlan, WeeklySchedule, Workout } from "@prisma/client";

type MealWithOptions = Meal & { options: MealOption[] };

interface ScheduleTimelineProps {
  isTrainingDay: boolean;
  meals: MealWithOptions[];
  supplements: SupplementPlan[];
  todaySchedule: (WeeklySchedule & { workout: Workout | null }) | null;
  workoutCompleted: boolean;
  supplementLogs: { supplementName: string; taken: boolean }[];
}

export function ScheduleTimeline({
  isTrainingDay,
  meals,
  supplements,
  todaySchedule,
  workoutCompleted,
  supplementLogs,
}: ScheduleTimelineProps) {
  // Build timeline items sorted by time
  const timelineItems: {
    time: string;
    type: "water" | "workout" | "meal" | "supplements";
    data?: MealWithOptions;
  }[] = [];

  // Morning water
  timelineItems.push({ time: "07:30", type: "water" });

  // Workout (if training day)
  if (isTrainingDay && todaySchedule?.workout) {
    timelineItems.push({ time: "08:00", type: "workout" });
  }

  // Meals
  for (const meal of meals) {
    timelineItems.push({ time: meal.time, type: "meal", data: meal });
  }

  // Sort by time
  timelineItems.sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="relative pl-7">
      {/* Timeline line */}
      <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />

      {timelineItems.map((item, i) => (
        <div key={i} className="relative mb-4">
          {/* Dot */}
          <div
            className={`absolute -left-5 top-1 h-3 w-3 rounded-full border-2 border-background ${
              item.type === "workout"
                ? "bg-primary"
                : item.type === "water"
                  ? "bg-success"
                  : "bg-muted-foreground/30"
            }`}
          />

          {item.type === "water" && (
            <div className="rounded-xl border border-border bg-muted p-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground font-mono">
                    {item.time}
                  </span>
                  <span className="ml-2">💧 Pola litra vode po buđenju</span>
                </div>
              </div>
            </div>
          )}

          {item.type === "workout" && todaySchedule?.workout && (
            <Link href="/client/workout">
              <div className="rounded-xl border border-primary/30 bg-primary/10 p-3 cursor-pointer hover:bg-primary/15 transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs text-muted-foreground font-mono">
                      {item.time}
                    </span>
                    <span className="ml-2 font-semibold">
                      🏋️ {todaySchedule.workout.name}
                    </span>
                  </div>
                  <div className="text-sm">
                    {workoutCompleted ? (
                      <span className="text-success">✓ Završen</span>
                    ) : (
                      <span className="text-primary">Započni →</span>
                    )}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground mt-1 ml-11">
                  {todaySchedule.workout.focus}
                </div>
              </div>
            </Link>
          )}

          {item.type === "meal" && item.data && (
            <MealCard meal={item.data} />
          )}
        </div>
      ))}
    </div>
  );
}

function MealCard({ meal }: { meal: MealWithOptions }) {
  return (
    <div className="rounded-xl border border-border bg-muted p-3">
      <span className="text-xs text-muted-foreground font-mono">{meal.time}</span>
      <span className="ml-2">
        {meal.icon || "🍽️"} {meal.name}
      </span>
      <div className="mt-1.5 ml-11 flex gap-3 text-xs font-mono">
        <span className="text-secondary">P: {meal.protein}g</span>
        <span className="text-warning">C: {meal.carbs}g</span>
        <span className="text-success">F: {meal.fat}g</span>
      </div>
      {meal.options.length > 0 && (
        <div className="mt-2 ml-11 space-y-1.5">
          {meal.options.map((opt) => (
            <div key={opt.id}>
              <span className="text-xs text-primary">Opcija {opt.optionNumber}:</span>
              <div className="text-sm text-muted-foreground mt-0.5 rounded-md bg-card p-1.5">
                {opt.description}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create daily goals component**

Create `src/components/client/daily-goals.tsx`:

```tsx
"use client";

interface DailyGoalsProps {
  waterMl: number;
  waterTarget: number;
  workoutCompleted: boolean;
  isTrainingDay: boolean;
  supplementsTaken: number;
  supplementsTotal: number;
  steps: number | null;
}

export function DailyGoals({
  waterMl,
  waterTarget,
  workoutCompleted,
  isTrainingDay,
  supplementsTaken,
  supplementsTotal,
  steps,
}: DailyGoalsProps) {
  const goals = [
    {
      label: `Voda (3-4L)`,
      done: waterMl >= waterTarget,
      detail: `${(waterMl / 1000).toFixed(1)}L`,
    },
    {
      label: "Suplementi",
      done: supplementsTaken >= supplementsTotal && supplementsTotal > 0,
      detail: `${supplementsTaken}/${supplementsTotal}`,
    },
    ...(isTrainingDay
      ? [
          {
            label: "Trening",
            done: workoutCompleted,
            detail: workoutCompleted ? "Završen" : "Nije završen",
          },
        ]
      : []),
    {
      label: "Koraci (5000-7000)",
      done: (steps ?? 0) >= 5000,
      detail: steps ? `${steps}` : "—",
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-muted p-3.5">
      <div className="font-semibold mb-2.5">✅ Dnevni ciljevi</div>
      <div className="space-y-2">
        {goals.map((goal) => (
          <div key={goal.label} className="flex items-center gap-2 text-sm">
            <div
              className={`h-4 w-4 rounded border flex items-center justify-center text-xs ${
                goal.done
                  ? "bg-success/20 border-success text-success"
                  : "border-border"
              }`}
            >
              {goal.done && "✓"}
            </div>
            <span className={goal.done ? "text-muted-foreground" : ""}>
              {goal.label}
            </span>
            <span className="ml-auto font-mono text-xs text-muted-foreground">
              {goal.detail}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create quick actions component**

Create `src/components/client/quick-actions.tsx`:

```tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function QuickActions() {
  const router = useRouter();

  return (
    <div className="flex gap-2">
      <Button
        className="flex-1"
        onClick={() => router.push("/client/log/water")}
      >
        + Voda
      </Button>
      <Button
        variant="outline"
        className="flex-1"
        onClick={() => router.push("/client/log/food")}
      >
        + Obrok
      </Button>
      <Button
        variant="outline"
        className="flex-1"
        onClick={() => router.push("/client/log/weight")}
      >
        + Težina
      </Button>
    </div>
  );
}
```

- [ ] **Step 5: Build the main client page**

Replace `src/app/(dashboard)/client/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";
import { getTodaySchedule } from "@/lib/queries/schedule";
import { ScheduleTimeline } from "@/components/client/schedule-timeline";
import { DailyStats } from "@/components/client/daily-stats";
import { DailyGoals } from "@/components/client/daily-goals";
import { QuickActions } from "@/components/client/quick-actions";

const DAY_NAMES = [
  "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota", "Nedelja",
];

export default async function ClientPage() {
  const session = await requireRole("CLIENT");
  const schedule = await getTodaySchedule(session.user.id);

  const now = new Date();
  const jsDay = now.getDay();
  const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
  const dayName = DAY_NAMES[dayOfWeek];
  const dateStr = now.toLocaleDateString("sr-Latn-RS", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const waterTarget = 3500; // 3.5L default
  const supplementsTaken = schedule.supplementLogs.filter((l) => l.taken).length;

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      {/* Date header */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground uppercase tracking-wider">
          {dayName}
        </div>
        <div className="text-xl font-semibold">{dateStr}</div>
        {schedule.isTrainingDay && schedule.todaySchedule?.workout ? (
          <div className="inline-block mt-1.5 rounded-full bg-primary px-3.5 py-1 text-xs text-primary-foreground">
            🏋️ {schedule.todaySchedule.label} — {schedule.todaySchedule.workout.focus}
          </div>
        ) : (
          <div className="inline-block mt-1.5 rounded-full bg-muted px-3.5 py-1 text-xs text-muted-foreground">
            🌿 Dan odmora
          </div>
        )}
      </div>

      {/* Quick stats */}
      <DailyStats
        waterMl={schedule.totalWaterMl}
        waterTargetMl={waterTarget}
        proteinConsumed={0}
        proteinTarget={schedule.nutritionPlan?.totalProtein ?? 170}
        kcalConsumed={0}
        kcalTarget={schedule.nutritionPlan?.totalKcalMax ?? 1950}
      />

      {/* Timeline */}
      <ScheduleTimeline
        isTrainingDay={schedule.isTrainingDay}
        meals={schedule.meals}
        supplements={schedule.supplements}
        todaySchedule={schedule.todaySchedule as any}
        workoutCompleted={schedule.workoutCompleted}
        supplementLogs={schedule.supplementLogs}
      />

      {/* Supplements */}
      {schedule.supplements.length > 0 && (
        <div className="rounded-xl border border-border bg-muted p-3.5">
          <div className="font-semibold mb-2.5">💊 Suplementi</div>
          <div className="space-y-2">
            {schedule.supplements.map((sup) => {
              const taken = schedule.supplementLogs.find(
                (l) => l.supplementName === sup.name
              )?.taken ?? false;
              return (
                <div key={sup.id} className="flex items-center gap-2 text-sm">
                  <div
                    className={`h-4 w-4 rounded border flex items-center justify-center text-xs ${
                      taken
                        ? "bg-primary/20 border-primary text-primary"
                        : "border-border"
                    }`}
                  >
                    {taken && "✓"}
                  </div>
                  <span>{sup.name}</span>
                  <span className="text-muted-foreground">— {sup.dose} {sup.timing}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Daily goals */}
      <DailyGoals
        waterMl={schedule.totalWaterMl}
        waterTarget={waterTarget}
        workoutCompleted={schedule.workoutCompleted}
        isTrainingDay={schedule.isTrainingDay}
        supplementsTaken={supplementsTaken}
        supplementsTotal={schedule.supplements.length}
        steps={schedule.dailyLog?.steps ?? null}
      />

      {/* Quick actions */}
      <QuickActions />
    </div>
  );
}
```

- [ ] **Step 6: Verify the page renders**

```bash
pnpm build
```

Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/components/client/ src/app/\(dashboard\)/client/page.tsx
git commit -m "feat: client today's schedule page with timeline, stats, goals, and quick actions"
```

---

### Task 4: Guided Workout Page

**Files:**
- Create: `src/components/client/workout-warmups.tsx`
- Create: `src/components/client/workout-exercises.tsx`
- Create: `src/app/(dashboard)/client/workout/page.tsx`

- [ ] **Step 1: Create warmup exercises component**

Create `src/components/client/workout-warmups.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { WarmupExercise } from "@prisma/client";

interface WorkoutWarmupsProps {
  warmups: WarmupExercise[];
}

export function WorkoutWarmups({ warmups }: WorkoutWarmupsProps) {
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const doneCount = completed.size;

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="rounded-full bg-warning px-2.5 py-0.5 text-xs font-bold text-background uppercase tracking-wide">
          Aktivacije
        </span>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{warmups.length} završeno
        </span>
      </div>

      <div className="space-y-2">
        {warmups.map((w) => {
          const isDone = completed.has(w.id);
          return (
            <div
              key={w.id}
              className={`rounded-xl border p-3 transition-all cursor-pointer ${
                isDone
                  ? "border-success/20 bg-success/5 opacity-70"
                  : "border-border bg-muted"
              }`}
              onClick={() => toggle(w.id)}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs ${
                    isDone
                      ? "bg-success/20 border-success text-success"
                      : "border-border"
                  }`}
                >
                  {isDone && "✓"}
                </div>
                <span className={isDone ? "line-through text-muted-foreground" : ""}>
                  {w.name}
                </span>
                {w.videoUrl && (
                  <a
                    href={w.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto text-xs text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ▶ Video
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create main exercises component**

Create `src/components/client/workout-exercises.tsx`:

```tsx
"use client";

import { useState } from "react";
import type { Exercise } from "@prisma/client";
import { Input } from "@/components/ui/input";

interface ExerciseLogData {
  exerciseId: string;
  completed: boolean;
  weight?: number;
  reps?: string;
}

interface WorkoutExercisesProps {
  exercises: Exercise[];
  onLogsChange: (logs: ExerciseLogData[]) => void;
}

export function WorkoutExercises({ exercises, onLogsChange }: WorkoutExercisesProps) {
  const [logs, setLogs] = useState<Map<string, ExerciseLogData>>(new Map());
  const [expanded, setExpanded] = useState<string | null>(exercises[0]?.id ?? null);

  const doneCount = Array.from(logs.values()).filter((l) => l.completed).length;

  function updateLog(exerciseId: string, update: Partial<ExerciseLogData>) {
    setLogs((prev) => {
      const next = new Map(prev);
      const current = next.get(exerciseId) ?? {
        exerciseId,
        completed: false,
      };
      next.set(exerciseId, { ...current, ...update });
      onLogsChange(Array.from(next.values()));
      return next;
    });
  }

  // Parse sets like "2×12" to get set count
  function getSetCount(sets: string): number {
    const match = sets.match(/^(\d+)/);
    return match ? parseInt(match[1], 10) : 2;
  }

  return (
    <div className="mb-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-bold text-primary-foreground uppercase tracking-wide">
          Glavni deo
        </span>
        <span className="text-xs text-muted-foreground">
          {doneCount}/{exercises.length} završeno
        </span>
      </div>

      <div className="space-y-2">
        {exercises.map((ex) => {
          const isExpanded = expanded === ex.id;
          const log = logs.get(ex.id);
          const isDone = log?.completed ?? false;
          const setCount = getSetCount(ex.sets);

          return (
            <div
              key={ex.id}
              className={`rounded-xl border p-3 transition-all ${
                isDone
                  ? "border-success/20 bg-success/5 opacity-70"
                  : isExpanded
                    ? "border-primary/25 bg-primary/5"
                    : "border-border bg-muted"
              }`}
            >
              <div
                className="flex items-center gap-2.5 cursor-pointer"
                onClick={() => setExpanded(isExpanded ? null : ex.id)}
              >
                <div
                  className={`h-5 w-5 rounded-md border flex items-center justify-center text-xs cursor-pointer ${
                    isDone
                      ? "bg-success/20 border-success text-success"
                      : "border-border"
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateLog(ex.id, { completed: !isDone });
                  }}
                >
                  {isDone && "✓"}
                </div>
                <div className="flex-1">
                  <span className="text-xs text-primary font-bold font-mono">
                    {ex.exerciseId}
                  </span>
                  <span className="ml-1.5 font-medium">{ex.name}</span>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {ex.sets}
                    {ex.note && ` · ${ex.note}`}
                  </div>
                </div>
                {ex.videoUrl && (
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-primary"
                    onClick={(e) => e.stopPropagation()}
                  >
                    ▶ Video
                  </a>
                )}
              </div>

              {isExpanded && !isDone && (
                <div className="mt-3 ml-7 space-y-2">
                  {ex.note && (
                    <div className="text-sm text-warning italic">
                      💡 {ex.note}
                    </div>
                  )}
                  {Array.from({ length: setCount }, (_, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-12">
                        Set {i + 1}:
                      </span>
                      <Input
                        type="number"
                        placeholder="kg"
                        className="w-16 h-8 text-sm font-mono"
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          if (!isNaN(val)) updateLog(ex.id, { weight: val });
                        }}
                      />
                      <span className="text-muted-foreground text-sm">×</span>
                      <Input
                        type="number"
                        placeholder="rep"
                        className="w-14 h-8 text-sm font-mono"
                        onChange={(e) => {
                          updateLog(ex.id, { reps: e.target.value });
                        }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Build the guided workout page**

Create `src/app/(dashboard)/client/workout/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";
import { getTodayWorkout } from "@/lib/queries/workout";
import { WorkoutPageClient } from "./workout-client";

export default async function WorkoutPage() {
  const session = await requireRole("CLIENT");
  const data = await getTodayWorkout(session.user.id);

  if (!data) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="text-4xl mb-4">🌿</div>
        <h1 className="text-xl font-semibold">Dan odmora</h1>
        <p className="text-muted-foreground mt-2">
          Danas nema treninga. Uživaj u odmoru i šetnji!
        </p>
      </div>
    );
  }

  // Serialize for client component
  const workout = {
    id: data.workout.id,
    name: data.workout.name,
    focus: data.workout.focus,
    warmups: data.workout.warmups,
    exercises: data.workout.exercises,
  };

  const alreadyCompleted = data.existingLog?.completed ?? false;

  return (
    <WorkoutPageClient
      workout={workout}
      alreadyCompleted={alreadyCompleted}
    />
  );
}
```

- [ ] **Step 4: Create workout client wrapper**

Create `src/app/(dashboard)/client/workout/workout-client.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { WorkoutWarmups } from "@/components/client/workout-warmups";
import { WorkoutExercises } from "@/components/client/workout-exercises";
import type { WarmupExercise, Exercise } from "@prisma/client";

interface ExerciseLogData {
  exerciseId: string;
  completed: boolean;
  weight?: number;
  reps?: string;
}

interface WorkoutPageClientProps {
  workout: {
    id: string;
    name: string;
    focus: string;
    warmups: WarmupExercise[];
    exercises: Exercise[];
  };
  alreadyCompleted: boolean;
}

export function WorkoutPageClient({ workout, alreadyCompleted }: WorkoutPageClientProps) {
  const router = useRouter();
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLogData[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(alreadyCompleted);

  const allExercisesDone = exerciseLogs.filter((l) => l.completed).length === workout.exercises.length;

  async function finishWorkout() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/client/workout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workoutId: workout.id,
          exerciseLogs: exerciseLogs.map((l) => ({
            exerciseId: l.exerciseId,
            completed: l.completed,
            weight: l.weight,
            reps: l.reps,
          })),
        }),
      });

      if (res.ok) {
        setDone(true);
        router.refresh();
      }
    } finally {
      setSubmitting(false);
    }
  }

  const now = new Date();
  const dateStr = now.toLocaleDateString("sr-Latn-RS", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const totalExercises = workout.warmups.length + workout.exercises.length;
  const completedCount = exerciseLogs.filter((l) => l.completed).length;

  if (done) {
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="text-4xl mb-4">🎉</div>
        <h1 className="text-xl font-semibold">Trening završen!</h1>
        <p className="text-muted-foreground mt-2">
          Svaka čast! {workout.name} je uspešno završen.
        </p>
        <Button className="mt-6" onClick={() => router.push("/client")}>
          Nazad na raspored
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-4">
      {/* Header */}
      <div className="text-center">
        <div className="text-xs text-muted-foreground">{dateStr}</div>
        <div className="text-xl font-semibold mt-1">{workout.name}</div>
        <div className="text-sm text-secondary">{workout.focus}</div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="h-1.5 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(completedCount / totalExercises) * 100}%` }}
          />
        </div>
        <div className="text-xs text-muted-foreground text-center mt-1.5">
          {completedCount} / {totalExercises} završeno
        </div>
      </div>

      {/* Warmups */}
      <WorkoutWarmups warmups={workout.warmups} />

      {/* Exercises */}
      <WorkoutExercises
        exercises={workout.exercises}
        onLogsChange={setExerciseLogs}
      />

      {/* Finish button */}
      <Button
        className="w-full"
        size="lg"
        disabled={!allExercisesDone || submitting}
        onClick={finishWorkout}
      >
        {submitting ? "Čuvanje..." : "Završi trening"}
      </Button>
      {!allExercisesDone && (
        <p className="text-xs text-muted-foreground text-center">
          Završi sve vežbe da aktiviraš dugme
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
pnpm build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/client/workout-warmups.tsx src/components/client/workout-exercises.tsx src/app/\(dashboard\)/client/workout/
git commit -m "feat: guided workout page with warmups, exercises, and completion logging"
```

---

### Task 5: Weight and Water Logging Pages

**Files:**
- Create: `src/components/client/weight-form.tsx`
- Create: `src/app/(dashboard)/client/log/weight/page.tsx`
- Create: `src/components/client/water-tracker.tsx`
- Create: `src/app/(dashboard)/client/log/water/page.tsx`

- [ ] **Step 1: Create weight form component**

Create `src/components/client/weight-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WeightForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const weight = parseFloat(formData.get("weight") as string);
    const note = formData.get("note") as string;

    const res = await fetch("/api/client/weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ weight, note: note || undefined }),
    });

    setLoading(false);
    if (res.ok) {
      router.refresh();
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="weight">Težina (kg)</Label>
        <Input
          id="weight"
          name="weight"
          type="number"
          step="0.1"
          placeholder="npr. 104.5"
          required
          className="font-mono"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">Napomena (opciono)</Label>
        <Input id="note" name="note" placeholder="npr. Ujutru, pre jela" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Čuvanje..." : "Sačuvaj"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Create weight page**

Create `src/app/(dashboard)/client/log/weight/page.tsx`:

```tsx
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
```

- [ ] **Step 3: Create water tracker component**

Create `src/components/client/water-tracker.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface WaterTrackerProps {
  totalMl: number;
  targetMl: number;
}

export function WaterTracker({ totalMl, targetMl }: WaterTrackerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [customAmount, setCustomAmount] = useState("");

  async function addWater(amountMl: number) {
    setLoading(true);
    await fetch("/api/client/water", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amountMl }),
    });
    setLoading(false);
    setCustomAmount("");
    router.refresh();
  }

  const percentage = Math.min((totalMl / targetMl) * 100, 100);

  return (
    <div className="space-y-4">
      {/* Progress */}
      <div className="text-center">
        <div className="text-3xl font-mono font-bold text-success">
          {(totalMl / 1000).toFixed(1)}L
        </div>
        <div className="text-sm text-muted-foreground">
          od {(targetMl / 1000).toFixed(1)}L cilja
        </div>
        <div className="mt-3 h-3 rounded-full bg-border overflow-hidden">
          <div
            className="h-full bg-success rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Quick add buttons */}
      <div className="grid grid-cols-3 gap-2">
        <Button
          variant="outline"
          onClick={() => addWater(250)}
          disabled={loading}
        >
          +250 mL
        </Button>
        <Button
          variant="outline"
          onClick={() => addWater(500)}
          disabled={loading}
        >
          +500 mL
        </Button>
        <Button
          variant="outline"
          onClick={() => addWater(1000)}
          disabled={loading}
        >
          +1L
        </Button>
      </div>

      {/* Custom amount */}
      <div className="flex gap-2">
        <Input
          type="number"
          placeholder="mL"
          value={customAmount}
          onChange={(e) => setCustomAmount(e.target.value)}
          className="font-mono"
        />
        <Button
          onClick={() => {
            const val = parseInt(customAmount, 10);
            if (val > 0) addWater(val);
          }}
          disabled={loading || !customAmount}
        >
          Dodaj
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create water page**

Create `src/app/(dashboard)/client/log/water/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";
import { getTodayWaterLogs } from "@/lib/queries/logs";
import { WaterTracker } from "@/components/client/water-tracker";

export default async function WaterPage() {
  const session = await requireRole("CLIENT");
  const waterLogs = await getTodayWaterLogs(session.user.id);

  const totalMl = waterLogs.reduce((sum, l) => sum + l.amountMl, 0);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-semibold">💧 Voda</h1>

      <div className="rounded-xl border border-border bg-muted p-4">
        <WaterTracker totalMl={totalMl} targetMl={3500} />
      </div>

      {/* Today's entries */}
      {waterLogs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Današnji unosi
          </h2>
          <div className="space-y-1.5">
            {waterLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between rounded-lg border border-border bg-muted p-2.5 text-sm"
              >
                <span className="font-mono">{log.amountMl} mL</span>
                <span className="text-muted-foreground">{log.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Verify build**

```bash
pnpm build
```

- [ ] **Step 6: Commit**

```bash
git add src/components/client/weight-form.tsx src/components/client/water-tracker.tsx src/app/\(dashboard\)/client/log/weight/ src/app/\(dashboard\)/client/log/water/
git commit -m "feat: weight and water logging pages"
```

---

### Task 6: Food, Supplements, and Body Composition Logging Pages

**Files:**
- Create: `src/components/client/meal-log-form.tsx`
- Create: `src/app/(dashboard)/client/log/food/page.tsx`
- Create: `src/components/client/supplement-checklist.tsx`
- Create: `src/app/(dashboard)/client/log/supplements/page.tsx`
- Create: `src/components/client/body-comp-form.tsx`
- Create: `src/app/(dashboard)/client/log/body-comp/page.tsx`

- [ ] **Step 1: Create meal log form**

Create `src/components/client/meal-log-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function MealLogForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/client/meal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mealName: formData.get("mealName"),
        description: formData.get("description"),
        time: formData.get("time") || undefined,
        onPlan: formData.get("onPlan") === "on",
      }),
    });

    setLoading(false);
    if (res.ok) {
      router.refresh();
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="mealName">Obrok</Label>
        <Input id="mealName" name="mealName" placeholder="npr. Ručak" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="description">Šta si jeo/la</Label>
        <Input
          id="description"
          name="description"
          placeholder="npr. 250g piletina + krompir + salata"
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="time">Vreme (opciono)</Label>
        <Input id="time" name="time" type="time" />
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="onPlan" defaultChecked className="accent-primary" />
        Po planu
      </label>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Čuvanje..." : "Sačuvaj"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Create food diary page**

Create `src/app/(dashboard)/client/log/food/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";
import { getTodayMealLogs } from "@/lib/queries/logs";
import { MealLogForm } from "@/components/client/meal-log-form";

export default async function FoodPage() {
  const session = await requireRole("CLIENT");
  const mealLogs = await getTodayMealLogs(session.user.id);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-semibold">📝 Dnevnik ishrane</h1>

      <div className="rounded-xl border border-border bg-muted p-4">
        <MealLogForm />
      </div>

      {mealLogs.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">
            Danas
          </h2>
          <div className="space-y-2">
            {mealLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-lg border border-border bg-muted p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{log.mealName}</span>
                  <span className="text-xs text-muted-foreground">{log.time}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {log.description}
                </div>
                {!log.onPlan && (
                  <span className="inline-block mt-1 text-xs text-warning">
                    Van plana
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Create supplement checklist component**

Create `src/components/client/supplement-checklist.tsx`:

```tsx
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
```

- [ ] **Step 4: Create supplements page**

Create `src/app/(dashboard)/client/log/supplements/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";
import { getSupplementPlan, getTodaySupplementLogs } from "@/lib/queries/logs";
import { SupplementChecklist } from "@/components/client/supplement-checklist";

export default async function SupplementsPage() {
  const session = await requireRole("CLIENT");
  const [supplements, logs] = await Promise.all([
    getSupplementPlan(session.user.id),
    getTodaySupplementLogs(session.user.id),
  ]);

  const takenCount = logs.filter((l) => l.taken).length;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">💊 Suplementi</h1>
        <span className="text-sm text-muted-foreground">
          {takenCount}/{supplements.length}
        </span>
      </div>

      {supplements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nema definisanih suplemenata u planu.
        </p>
      ) : (
        <SupplementChecklist
          supplements={supplements}
          initialLogs={logs}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create body composition form**

Create `src/components/client/body-comp-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const FIELDS = [
  { name: "weight", label: "Težina (kg)", step: "0.1" },
  { name: "bodyFatPct", label: "Telesna mast (%)", step: "0.1" },
  { name: "fatMass", label: "Masna masa (kg)", step: "0.1" },
  { name: "muscleMass", label: "Mišićna masa (kg)", step: "0.1" },
  { name: "musclePct", label: "Mišićna masa (%)", step: "0.1" },
  { name: "skeletalMuscle", label: "Skeletna mišićna masa (kg)", step: "0.1" },
  { name: "bodyWater", label: "Voda u telu (%)", step: "0.1" },
  { name: "visceralFat", label: "Visceralna mast", step: "1" },
  { name: "bmr", label: "BMR (kcal)", step: "1" },
  { name: "bmi", label: "BMI", step: "0.1" },
  { name: "waistHip", label: "Struk/kuk odnos", step: "0.01" },
  { name: "heartRate", label: "Puls (bpm)", step: "1" },
] as const;

export function BodyCompForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data: Record<string, number | string | undefined> = {};

    for (const field of FIELDS) {
      const val = formData.get(field.name) as string;
      if (val) {
        data[field.name] = parseFloat(val);
      }
    }

    const note = formData.get("note") as string;
    if (note) data.note = note;

    const res = await fetch("/api/client/body-comp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    setLoading(false);
    if (res.ok) {
      router.refresh();
      (e.target as HTMLFormElement).reset();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {FIELDS.map((field) => (
          <div key={field.name} className="space-y-1">
            <Label htmlFor={field.name} className="text-xs">
              {field.label}
            </Label>
            <Input
              id={field.name}
              name={field.name}
              type="number"
              step={field.step}
              className="font-mono h-9"
            />
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="note">Napomena</Label>
        <Input id="note" name="note" placeholder="npr. Merenje kod nutricioniste" />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Čuvanje..." : "Sačuvaj"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 6: Create body composition page**

Create `src/app/(dashboard)/client/log/body-comp/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";
import { getBodyCompHistory } from "@/lib/queries/logs";
import { BodyCompForm } from "@/components/client/body-comp-form";

export default async function BodyCompPage() {
  const session = await requireRole("CLIENT");
  const history = await getBodyCompHistory(session.user.id);

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <h1 className="text-xl font-semibold">📊 Telesna kompozicija</h1>

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
```

- [ ] **Step 7: Verify build**

```bash
pnpm build
```

- [ ] **Step 8: Commit**

```bash
git add src/components/client/meal-log-form.tsx src/components/client/supplement-checklist.tsx src/components/client/body-comp-form.tsx src/app/\(dashboard\)/client/log/
git commit -m "feat: food diary, supplement checklist, and body composition logging pages"
```

---

### Task 7: Nutrition Page

**Files:**
- Create: `src/app/(dashboard)/client/nutrition/page.tsx`

- [ ] **Step 1: Create the nutrition page**

Create `src/app/(dashboard)/client/nutrition/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";
import { getTodaySchedule } from "@/lib/queries/schedule";

export default async function NutritionPage() {
  const session = await requireRole("CLIENT");
  const schedule = await getTodaySchedule(session.user.id);

  const plan = schedule.nutritionPlan;
  const isTraining = schedule.isTrainingDay;

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold">🍽️ Današnja ishrana</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isTraining ? "Trening dan" : "Dan odmora"} —{" "}
          {plan
            ? `P: ${plan.totalProtein}g / C: ${isTraining ? plan.totalCarbsTrain : plan.totalCarbsRest}g / F: ${isTraining ? plan.totalFatTrain : plan.totalFatRest}g`
            : "Nema aktivnog plana"}
        </p>
      </div>

      {schedule.meals.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nema definisanih obroka u planu.
        </p>
      ) : (
        <div className="space-y-3">
          {schedule.meals.map((meal) => (
            <div
              key={meal.id}
              className="rounded-xl border border-border bg-muted p-4"
            >
              <div className="flex items-center justify-between">
                <div className="font-medium">
                  {meal.icon || "🍽️"} {meal.name}
                </div>
                <span className="text-xs text-muted-foreground font-mono">
                  {meal.time}
                </span>
              </div>
              <div className="mt-1.5 flex gap-3 text-xs font-mono">
                <span className="text-secondary">P: {meal.protein}g</span>
                <span className="text-warning">C: {meal.carbs}g</span>
                <span className="text-success">F: {meal.fat}g</span>
                <span className="text-muted-foreground">
                  {meal.protein * 4 + meal.carbs * 4 + meal.fat * 9} kcal
                </span>
              </div>

              {meal.options.length > 0 && (
                <div className="mt-3 space-y-2">
                  {meal.options.map((opt) => (
                    <div key={opt.id}>
                      <span className="text-xs font-medium text-primary">
                        Opcija {opt.optionNumber}
                      </span>
                      <div className="text-sm text-foreground mt-0.5 rounded-md bg-card p-2">
                        {opt.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Nutrition rules */}
      {plan?.rules && (
        <div className="rounded-xl border border-border bg-muted p-4">
          <h2 className="font-semibold mb-2">📋 Pravila ishrane</h2>
          <ul className="space-y-1.5 text-sm text-muted-foreground">
            {(JSON.parse(plan.rules) as string[]).map((rule, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-primary">•</span>
                {rule}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

```bash
pnpm build
```

- [ ] **Step 3: Commit**

```bash
git add src/app/\(dashboard\)/client/nutrition/
git commit -m "feat: client nutrition page with today's meals, macros, and rules"
```

---

## Verification Checklist

After all tasks are complete:

1. `pnpm build` succeeds with no errors
2. Log in as `dusan@fittrack.rs` / `fittrack123`
3. `/client` — shows today's schedule with timeline, stats, goals, quick actions
4. `/client/workout` — shows guided workout (or rest day message depending on day of week)
5. `/client/nutrition` — shows today's meals with all options and macros
6. `/client/log/weight` — can add weight entry, see history
7. `/client/log/water` — can add water increments, see progress bar and today's entries
8. `/client/log/food` — can log meals, see today's entries
9. `/client/log/supplements` — can toggle supplements on/off
10. `/client/log/body-comp` — can enter body composition data, see history
11. All sidebar links work and navigate correctly
