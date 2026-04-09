# Trainer Pages Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build all trainer-facing pages — client list, client dashboard with compliance/metrics, and plan editors for nutrition, workout, and weekly schedule.

**Architecture:** Server Components fetch data via Prisma for reads. Plan editors use Client Components with react-hook-form for complex forms, submitting to API Route Handlers. Trainer queries in `src/lib/queries/trainer.ts`. API routes in `src/app/api/trainer/`.

**Tech Stack:** Next.js 16, Prisma 7, Auth.js v5, Tailwind CSS, shadcn/ui, zod, react-hook-form

---

## File Structure

```
src/
├── lib/queries/
│   └── trainer.ts                 # Trainer data queries
├── app/
│   ├── api/trainer/
│   │   ├── clients/route.ts       # POST add client
│   │   ├── nutrition/route.ts     # POST/PUT nutrition plan
│   │   ├── workout/route.ts       # POST/PUT workout plan
│   │   └── schedule/route.ts      # PUT weekly schedule
│   └── (dashboard)/trainer/
│       ├── page.tsx               # Client list
│       └── clients/[id]/
│           ├── page.tsx           # Client dashboard
│           ├── nutrition/page.tsx # Nutrition plan editor
│           ├── workout/page.tsx   # Workout plan editor
│           └── schedule/page.tsx  # Weekly schedule editor
└── components/trainer/
    ├── client-card.tsx            # Client summary card
    ├── compliance-grid.tsx        # 7-day compliance view
    ├── metrics-cards.tsx          # Overview metric cards
    ├── nutrition-editor.tsx       # Nutrition plan form
    ├── workout-editor.tsx         # Workout plan form
    └── schedule-editor.tsx        # Weekly schedule form
```

---

### Task 1: Trainer Data Queries & API Routes

**Files:**
- Create: `src/lib/queries/trainer.ts`
- Create: `src/app/api/trainer/clients/route.ts`
- Create: `src/app/api/trainer/nutrition/route.ts`
- Create: `src/app/api/trainer/workout/route.ts`
- Create: `src/app/api/trainer/schedule/route.ts`

- [ ] **Step 1: Create trainer queries**

Create `src/lib/queries/trainer.ts`:

```typescript
import { prisma } from "@/lib/prisma";

export async function getTrainerClients(trainerId: string) {
  const relations = await prisma.trainerClient.findMany({
    where: { trainerId, active: true },
    include: {
      client: {
        include: {
          weightLogs: { orderBy: { date: "desc" }, take: 1 },
          workoutLogs: {
            where: {
              date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          },
          dailyLogs: {
            where: {
              date: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
            },
          },
        },
      },
    },
  });

  return relations.map((r) => ({
    id: r.client.id,
    name: r.client.name,
    email: r.client.email,
    currentWeight: r.clientweight?.weight ?? null,
    lastActive: r.client.updatedAt,
    workoutsThisWeek: r.client.workoutLogs.filter((l) => l.completed).length,
  }));
}

export async function getClientDashboard(trainerId: string, clientId: string) {
  // Verify trainer-client relationship
  const relation = await prisma.trainerClient.findUnique({
    where: { trainerId_clientId: { trainerId, clientId } },
  });
  if (!relation) return null;

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    client,
    latestWeight,
    latestBodyComp,
    weightHistory,
    recentWorkoutLogs,
    recentDailyLogs,
    recentWaterLogs,
    recentSupplementLogs,
    labResults,
    nutritionPlan,
    workoutPlan,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: clientId } }),
    prisma.weightLog.findFirst({ where: { userId: clientId }, orderBy: { date: "desc" } }),
    prisma.bodyCompositionLog.findFirst({ where: { userId: clientId }, orderBy: { date: "desc" } }),
    prisma.weightLog.findMany({ where: { userId: clientId }, orderBy: { date: "desc" }, take: 10 }),
    prisma.workoutLog.findMany({ where: { userId: clientId, date: { gte: weekAgo } } }),
    prisma.dailyLog.findMany({ where: { userId: clientId, date: { gte: weekAgo } } }),
    prisma.waterLog.findMany({ where: { userId: clientId, date: { gte: weekAgo } } }),
    prisma.supplementLog.findMany({ where: { userId: clientId, date: { gte: weekAgo } } }),
    prisma.labResult.findMany({
      where: { userId: clientId },
      orderBy: { date: "desc" },
      take: 1,
      include: { items: true },
    }),
    prisma.nutritionPlan.findFirst({ where: { clientId, active: true } }),
    prisma.workoutPlan.findFirst({
      where: { clientId, active: true },
      include: { schedule: true },
    }),
  ]);

  return {
    client,
    latestWeight,
    latestBodyComp,
    weightHistory,
    recentWorkoutLogs,
    recentDailyLogs,
    recentWaterLogs,
    recentSupplementLogs,
    labResults,
    nutritionPlan,
    workoutPlan,
  };
}

export async function getClientNutritionPlan(trainerId: string, clientId: string) {
  const relation = await prisma.trainerClient.findUnique({
    where: { trainerId_clientId: { trainerId, clientId } },
  });
  if (!relation) return null;

  return prisma.nutritionPlan.findFirst({
    where: { clientId, active: true },
    include: {
      meals: {
        include: { options: { orderBy: { optionNumber: "asc" } } },
        orderBy: { orderIndex: "asc" },
      },
      supplements: true,
    },
  });
}

export async function getClientWorkoutPlan(trainerId: string, clientId: string) {
  const relation = await prisma.trainerClient.findUnique({
    where: { trainerId_clientId: { trainerId, clientId } },
  });
  if (!relation) return null;

  return prisma.workoutPlan.findFirst({
    where: { clientId, active: true },
    include: {
      workouts: {
        include: {
          warmups: { orderBy: { orderIndex: "asc" } },
          exercises: { orderBy: { orderIndex: "asc" } },
        },
        orderBy: { orderIndex: "asc" },
      },
      schedule: { orderBy: { dayOfWeek: "asc" } },
    },
  });
}
```

Note: The `getTrainerClients` function has a typo — `r.clientweight` should be `r.client.weightLogs[0]`. The implementer should fix this:

```typescript
currentWeight: r.client.weightLogs[0]?.weight ?? null,
```

- [ ] **Step 2: Create trainer API routes**

Create `src/app/api/trainer/clients/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addClientSchema = z.object({
  clientEmail: z.string().email(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientEmail } = addClientSchema.parse(body);

    const client = await prisma.user.findUnique({
      where: { email: clientEmail },
    });

    if (!client || client.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Klijent sa tim emailom nije pronađen" },
        { status: 404 }
      );
    }

    const existing = await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId: session.user.id,
          clientId: client.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Klijent je već dodat" },
        { status: 400 }
      );
    }

    await prisma.trainerClient.create({
      data: {
        trainerId: session.user.id,
        clientId: client.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidan email" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

Create `src/app/api/trainer/nutrition/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const mealOptionSchema = z.object({
  optionNumber: z.number().int().positive(),
  description: z.string().min(1),
});

const mealSchema = z.object({
  name: z.string().min(1),
  time: z.string(),
  orderIndex: z.number().int(),
  isTrainingDay: z.boolean(),
  protein: z.number().int().min(0),
  carbs: z.number().int().min(0),
  fat: z.number().int().min(0),
  icon: z.string().optional(),
  options: z.array(mealOptionSchema),
});

const supplementSchema = z.object({
  name: z.string().min(1),
  dose: z.string().min(1),
  timing: z.string().min(1),
  icon: z.string().optional(),
});

const nutritionPlanSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1),
  totalProtein: z.number().int().min(0),
  totalCarbsTrain: z.number().int().min(0),
  totalCarbsRest: z.number().int().min(0),
  totalFatTrain: z.number().int().min(0),
  totalFatRest: z.number().int().min(0),
  totalKcalMin: z.number().int().min(0),
  totalKcalMax: z.number().int().min(0),
  rules: z.string(),
  meals: z.array(mealSchema),
  supplements: z.array(supplementSchema),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = nutritionPlanSchema.parse(body);

    // Deactivate existing plans
    await prisma.nutritionPlan.updateMany({
      where: { clientId: data.clientId, active: true },
      data: { active: false },
    });

    const plan = await prisma.nutritionPlan.create({
      data: {
        trainerId: session.user.id,
        clientId: data.clientId,
        name: data.name,
        totalProtein: data.totalProtein,
        totalCarbsTrain: data.totalCarbsTrain,
        totalCarbsRest: data.totalCarbsRest,
        totalFatTrain: data.totalFatTrain,
        totalFatRest: data.totalFatRest,
        totalKcalMin: data.totalKcalMin,
        totalKcalMax: data.totalKcalMax,
        rules: data.rules,
        meals: {
          create: data.meals.map((meal) => ({
            name: meal.name,
            time: meal.time,
            orderIndex: meal.orderIndex,
            isTrainingDay: meal.isTrainingDay,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            icon: meal.icon,
            options: {
              create: meal.options,
            },
          })),
        },
        supplements: {
          create: data.supplements,
        },
      },
      include: { meals: { include: { options: true } }, supplements: true },
    });

    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

Create `src/app/api/trainer/workout/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const warmupSchema = z.object({
  name: z.string().min(1),
  videoUrl: z.string().optional(),
  orderIndex: z.number().int(),
});

const exerciseSchema = z.object({
  exerciseId: z.string().min(1),
  name: z.string().min(1),
  sets: z.string().min(1),
  note: z.string().optional(),
  videoUrl: z.string().optional(),
  orderIndex: z.number().int(),
});

const workoutSchema = z.object({
  name: z.string().min(1),
  focus: z.string().min(1),
  orderIndex: z.number().int(),
  warmups: z.array(warmupSchema),
  exercises: z.array(exerciseSchema),
});

const workoutPlanSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1),
  notes: z.string().optional(),
  workouts: z.array(workoutSchema),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = workoutPlanSchema.parse(body);

    // Deactivate existing plans
    await prisma.workoutPlan.updateMany({
      where: { clientId: data.clientId, active: true },
      data: { active: false },
    });

    const plan = await prisma.workoutPlan.create({
      data: {
        trainerId: session.user.id,
        clientId: data.clientId,
        name: data.name,
        notes: data.notes,
        workouts: {
          create: data.workouts.map((w) => ({
            name: w.name,
            focus: w.focus,
            orderIndex: w.orderIndex,
            warmups: { create: w.warmups },
            exercises: { create: w.exercises },
          })),
        },
      },
      include: {
        workouts: {
          include: { warmups: true, exercises: true },
        },
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

Create `src/app/api/trainer/schedule/route.ts`:

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  dayName: z.string(),
  type: z.enum(["training", "rest"]),
  workoutId: z.string().nullable(),
  label: z.string(),
  restNotes: z.string().nullable().optional(),
});

const scheduleSchema = z.object({
  planId: z.string(),
  days: z.array(daySchema).length(7),
});

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = scheduleSchema.parse(body);

    // Delete existing schedule and recreate
    await prisma.weeklySchedule.deleteMany({
      where: { planId: data.planId },
    });

    const entries = await Promise.all(
      data.days.map((day) =>
        prisma.weeklySchedule.create({
          data: {
            planId: data.planId,
            ...day,
          },
        })
      )
    );

    return NextResponse.json(entries);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add src/lib/queries/trainer.ts src/app/api/trainer/
git commit -m "feat: trainer data queries and API routes for clients, nutrition, workout, and schedule"
```

---

### Task 2: Client List Page

**Files:**
- Create: `src/components/trainer/client-card.tsx`
- Modify: `src/app/(dashboard)/trainer/page.tsx`

- [ ] **Step 1: Create client card component**

Create `src/components/trainer/client-card.tsx`:

```tsx
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
```

- [ ] **Step 2: Create add client dialog component**

Create `src/components/trainer/add-client-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AddClientForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/trainer/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientEmail: formData.get("email") }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    setSuccess(true);
    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="email">Email klijenta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="klijent@email.com"
          required
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      {success && <p className="text-sm text-success">Klijent uspešno dodat!</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Dodavanje..." : "Dodaj klijenta"}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Update trainer page**

Replace `src/app/(dashboard)/trainer/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";
import { getTrainerClients } from "@/lib/queries/trainer";
import { ClientCard } from "@/components/trainer/client-card";
import { AddClientForm } from "@/components/trainer/add-client-form";

export default async function TrainerPage() {
  const session = await requireRole("TRAINER");
  const clients = await getTrainerClients(session.user.id);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Moji klijenti</h1>
        <span className="text-sm text-muted-foreground">
          {clients.length} klijenata
        </span>
      </div>

      {clients.length === 0 ? (
        <p className="text-muted-foreground">Nema dodanih klijenata.</p>
      ) : (
        <div className="space-y-3">
          {clients.map((client) => (
            <ClientCard key={client.id} {...client} />
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border bg-muted p-4">
        <h2 className="font-semibold mb-3">Dodaj klijenta</h2>
        <AddClientForm />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/trainer/ src/app/\(dashboard\)/trainer/page.tsx
git commit -m "feat: trainer client list page with add client form"
```

---

### Task 3: Client Dashboard

**Files:**
- Create: `src/components/trainer/metrics-cards.tsx`
- Create: `src/components/trainer/compliance-grid.tsx`
- Create: `src/app/(dashboard)/trainer/clients/[id]/page.tsx`

- [ ] **Step 1: Create metrics cards component**

Create `src/components/trainer/metrics-cards.tsx`:

```tsx
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
```

- [ ] **Step 2: Create compliance grid component**

Create `src/components/trainer/compliance-grid.tsx`:

```tsx
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
```

- [ ] **Step 3: Create client dashboard page**

Create `src/app/(dashboard)/trainer/clients/[id]/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";
import { getClientDashboard } from "@/lib/queries/trainer";
import { MetricsCards } from "@/components/trainer/metrics-cards";
import { ComplianceGrid } from "@/components/trainer/compliance-grid";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ClientDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TRAINER");
  const { id } = await params;
  const data = await getClientDashboard(session.user.id, id);

  if (!data || !data.client) {
    redirect("/trainer");
  }

  const trainingDays = data.workoutPlan?.schedule.filter(
    (s) => s.type === "training"
  ).length ?? 3;

  // Build compliance data for last 7 days
  const now = new Date();
  const complianceDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    const jsDay = now.getDay();
    const mondayOffset = jsDay === 0 ? 6 : jsDay - 1;
    date.setDate(now.getDate() - mondayOffset + i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const daySchedule = data.workoutPlan?.schedule.find(
      (s) => s.dayOfWeek === i
    );
    const isTrainingDay = daySchedule?.type === "training";

    const dayWorkoutLog = data.recentWorkoutLogs.find(
      (l) => new Date(l.date).toDateString() === dayStart.toDateString()
    );
    const dayWaterLogs = data.recentWaterLogs.filter(
      (l) => new Date(l.date).toDateString() === dayStart.toDateString()
    );
    const totalWater = dayWaterLogs.reduce((sum, l) => sum + l.amountMl, 0);
    const daySupLogs = data.recentSupplementLogs.filter(
      (l) => new Date(l.date).toDateString() === dayStart.toDateString() && l.taken
    );

    return {
      date: dayStart,
      workout: isTrainingDay ? (dayWorkoutLog?.completed ?? false) : null,
      water: totalWater >= 3000,
      supplements: daySupLogs.length > 0,
    };
  });

  const latestLab = data.labResults[0];
  const flaggedItems = latestLab?.items.filter(
    (item) => item.status !== "ok"
  ) ?? [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{data.client.name}</h1>
        <p className="text-sm text-muted-foreground">{data.client.email}</p>
      </div>

      {/* Metrics */}
      <MetricsCards
        weight={data.latestWeight?.weight ?? null}
        bmi={data.latestBodyComp?.bmi ?? null}
        bodyFatPct={data.latestBodyComp?.bodyFatPct ?? null}
        workoutsThisWeek={data.recentWorkoutLogs.filter((l) => l.completed).length}
        trainingDaysPerWeek={trainingDays}
      />

      {/* Compliance */}
      <ComplianceGrid days={complianceDays} />

      {/* Weight history */}
      {data.weightHistory.length > 0 && (
        <div className="rounded-xl border border-border bg-muted p-4">
          <h3 className="font-semibold mb-3">Trend težine</h3>
          <div className="space-y-1.5">
            {data.weightHistory.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-muted-foreground">
                  {new Date(log.date).toLocaleDateString("sr-Latn-RS")}
                </span>
                <span className="font-mono">{log.weight} kg</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lab alerts */}
      {flaggedItems.length > 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4">
          <h3 className="font-semibold mb-2">⚠️ Lab rezultati — upozorenja</h3>
          <div className="space-y-1">
            {flaggedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span>{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono">{item.value} {item.unit}</span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      item.status === "high"
                        ? "bg-danger/20 text-danger"
                        : item.status === "low"
                          ? "bg-primary/20 text-primary"
                          : "bg-warning/20 text-warning"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground mt-2">
            {latestLab.labName} — {new Date(latestLab.date).toLocaleDateString("sr-Latn-RS")}
          </div>
        </div>
      )}

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        <Link
          href={`/trainer/clients/${id}/nutrition`}
          className="rounded-xl border border-border bg-muted p-3 text-center hover:bg-accent transition-colors"
        >
          <div className="text-xl">🍽️</div>
          <div className="text-sm mt-1">Ishrana</div>
        </Link>
        <Link
          href={`/trainer/clients/${id}/workout`}
          className="rounded-xl border border-border bg-muted p-3 text-center hover:bg-accent transition-colors"
        >
          <div className="text-xl">🏋️</div>
          <div className="text-sm mt-1">Trening</div>
        </Link>
        <Link
          href={`/trainer/clients/${id}/schedule`}
          className="rounded-xl border border-border bg-muted p-3 text-center hover:bg-accent transition-colors"
        >
          <div className="text-xl">📅</div>
          <div className="text-sm mt-1">Raspored</div>
        </Link>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Verify build**

```bash
pnpm build
```

- [ ] **Step 5: Commit**

```bash
git add src/components/trainer/ src/app/\(dashboard\)/trainer/clients/
git commit -m "feat: trainer client dashboard with metrics, compliance grid, and lab alerts"
```

---

### Task 4: Nutrition Plan Editor

**Files:**
- Create: `src/components/trainer/nutrition-editor.tsx`
- Create: `src/app/(dashboard)/trainer/clients/[id]/nutrition/page.tsx`

- [ ] **Step 1: Create nutrition editor component**

Create `src/components/trainer/nutrition-editor.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MealOption {
  optionNumber: number;
  description: string;
}

interface MealData {
  name: string;
  time: string;
  orderIndex: number;
  isTrainingDay: boolean;
  protein: number;
  carbs: number;
  fat: number;
  icon: string;
  options: MealOption[];
}

interface SupplementData {
  name: string;
  dose: string;
  timing: string;
  icon: string;
}

interface NutritionPlanData {
  name: string;
  totalProtein: number;
  totalCarbsTrain: number;
  totalCarbsRest: number;
  totalFatTrain: number;
  totalFatRest: number;
  totalKcalMin: number;
  totalKcalMax: number;
  rules: string;
  meals: MealData[];
  supplements: SupplementData[];
}

interface NutritionEditorProps {
  clientId: string;
  initialData: NutritionPlanData | null;
}

export function NutritionEditor({ clientId, initialData }: NutritionEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [plan, setPlan] = useState<NutritionPlanData>(
    initialData ?? {
      name: "",
      totalProtein: 0,
      totalCarbsTrain: 0,
      totalCarbsRest: 0,
      totalFatTrain: 0,
      totalFatRest: 0,
      totalKcalMin: 0,
      totalKcalMax: 0,
      rules: "[]",
      meals: [],
      supplements: [],
    }
  );

  function updateField<K extends keyof NutritionPlanData>(
    key: K,
    value: NutritionPlanData[K]
  ) {
    setPlan((prev) => ({ ...prev, [key]: value }));
  }

  function addMeal(isTrainingDay: boolean) {
    const meals = plan.meals.filter((m) => m.isTrainingDay === isTrainingDay);
    setPlan((prev) => ({
      ...prev,
      meals: [
        ...prev.meals,
        {
          name: "",
          time: "12:00",
          orderIndex: meals.length,
          isTrainingDay,
          protein: 0,
          carbs: 0,
          fat: 0,
          icon: "🍽️",
          options: [{ optionNumber: 1, description: "" }],
        },
      ],
    }));
  }

  function updateMeal(index: number, update: Partial<MealData>) {
    setPlan((prev) => ({
      ...prev,
      meals: prev.meals.map((m, i) => (i === index ? { ...m, ...update } : m)),
    }));
  }

  function removeMeal(index: number) {
    setPlan((prev) => ({
      ...prev,
      meals: prev.meals.filter((_, i) => i !== index),
    }));
  }

  function addOption(mealIndex: number) {
    const meal = plan.meals[mealIndex];
    const newOpt: MealOption = {
      optionNumber: meal.options.length + 1,
      description: "",
    };
    updateMeal(mealIndex, { options: [...meal.options, newOpt] });
  }

  function updateOption(mealIndex: number, optIndex: number, description: string) {
    const meal = plan.meals[mealIndex];
    const options = meal.options.map((o, i) =>
      i === optIndex ? { ...o, description } : o
    );
    updateMeal(mealIndex, { options });
  }

  function addSupplement() {
    setPlan((prev) => ({
      ...prev,
      supplements: [
        ...prev.supplements,
        { name: "", dose: "", timing: "", icon: "💊" },
      ],
    }));
  }

  function updateSupplement(index: number, update: Partial<SupplementData>) {
    setPlan((prev) => ({
      ...prev,
      supplements: prev.supplements.map((s, i) =>
        i === index ? { ...s, ...update } : s
      ),
    }));
  }

  function removeSupplement(index: number) {
    setPlan((prev) => ({
      ...prev,
      supplements: prev.supplements.filter((_, i) => i !== index),
    }));
  }

  async function savePlan() {
    setSaving(true);
    const res = await fetch("/api/trainer/nutrition", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, ...plan }),
    });
    setSaving(false);
    if (res.ok) {
      router.refresh();
    }
  }

  const trainingMeals = plan.meals
    .map((m, i) => ({ ...m, _index: i }))
    .filter((m) => m.isTrainingDay);
  const restMeals = plan.meals
    .map((m, i) => ({ ...m, _index: i }))
    .filter((m) => !m.isTrainingDay);

  return (
    <div className="space-y-6">
      {/* Plan name */}
      <div className="space-y-1.5">
        <Label>Naziv plana</Label>
        <Input
          value={plan.name}
          onChange={(e) => updateField("name", e.target.value)}
          placeholder="npr. Rekompozicija — Faza 1"
        />
      </div>

      {/* Macro targets */}
      <div>
        <h3 className="font-semibold mb-2">Makro ciljevi</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">Protein (g)</Label>
            <Input
              type="number"
              value={plan.totalProtein || ""}
              onChange={(e) => updateField("totalProtein", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ugljeni trening (g)</Label>
            <Input
              type="number"
              value={plan.totalCarbsTrain || ""}
              onChange={(e) => updateField("totalCarbsTrain", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Ugljeni odmor (g)</Label>
            <Input
              type="number"
              value={plan.totalCarbsRest || ""}
              onChange={(e) => updateField("totalCarbsRest", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Masti trening (g)</Label>
            <Input
              type="number"
              value={plan.totalFatTrain || ""}
              onChange={(e) => updateField("totalFatTrain", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Masti odmor (g)</Label>
            <Input
              type="number"
              value={plan.totalFatRest || ""}
              onChange={(e) => updateField("totalFatRest", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Min kcal</Label>
            <Input
              type="number"
              value={plan.totalKcalMin || ""}
              onChange={(e) => updateField("totalKcalMin", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Max kcal</Label>
            <Input
              type="number"
              value={plan.totalKcalMax || ""}
              onChange={(e) => updateField("totalKcalMax", parseInt(e.target.value) || 0)}
              className="font-mono"
            />
          </div>
        </div>
      </div>

      {/* Training day meals */}
      <MealSection
        title="Obroci — Trening dan"
        meals={trainingMeals}
        onUpdate={updateMeal}
        onRemove={removeMeal}
        onAddOption={addOption}
        onUpdateOption={updateOption}
        onAdd={() => addMeal(true)}
      />

      {/* Rest day meals */}
      <MealSection
        title="Obroci — Dan odmora"
        meals={restMeals}
        onUpdate={updateMeal}
        onRemove={removeMeal}
        onAddOption={addOption}
        onUpdateOption={updateOption}
        onAdd={() => addMeal(false)}
      />

      {/* Supplements */}
      <div>
        <h3 className="font-semibold mb-2">Suplementi</h3>
        <div className="space-y-2">
          {plan.supplements.map((sup, i) => (
            <div key={i} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Input
                  placeholder="Naziv"
                  value={sup.name}
                  onChange={(e) => updateSupplement(i, { name: e.target.value })}
                />
              </div>
              <div className="w-32 space-y-1">
                <Input
                  placeholder="Doza"
                  value={sup.dose}
                  onChange={(e) => updateSupplement(i, { dose: e.target.value })}
                />
              </div>
              <div className="w-32 space-y-1">
                <Input
                  placeholder="Tajming"
                  value={sup.timing}
                  onChange={(e) => updateSupplement(i, { timing: e.target.value })}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeSupplement(i)}
              >
                ✕
              </Button>
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addSupplement}>
            + Suplement
          </Button>
        </div>
      </div>

      {/* Rules */}
      <div className="space-y-1.5">
        <Label>Pravila ishrane (jedno pravilo po redu)</Label>
        <textarea
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm min-h-[120px] focus:outline-none focus:ring-2 focus:ring-ring"
          value={(() => {
            try {
              return (JSON.parse(plan.rules) as string[]).join("\n");
            } catch {
              return plan.rules;
            }
          })()}
          onChange={(e) =>
            updateField(
              "rules",
              JSON.stringify(e.target.value.split("\n").filter(Boolean))
            )
          }
        />
      </div>

      {/* Save */}
      <Button className="w-full" size="lg" onClick={savePlan} disabled={saving}>
        {saving ? "Čuvanje..." : "Sačuvaj plan ishrane"}
      </Button>
    </div>
  );
}

// ─── Meal Section ────────────────────────────────────────────

interface MealWithIndex extends MealData {
  _index: number;
}

function MealSection({
  title,
  meals,
  onUpdate,
  onRemove,
  onAddOption,
  onUpdateOption,
  onAdd,
}: {
  title: string;
  meals: MealWithIndex[];
  onUpdate: (index: number, update: Partial<MealData>) => void;
  onRemove: (index: number) => void;
  onAddOption: (mealIndex: number) => void;
  onUpdateOption: (mealIndex: number, optIndex: number, desc: string) => void;
  onAdd: () => void;
}) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="space-y-3">
        {meals.map((meal) => (
          <div
            key={meal._index}
            className="rounded-lg border border-border bg-card p-3 space-y-2"
          >
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Input
                  placeholder="Naziv obroka"
                  value={meal.name}
                  onChange={(e) => onUpdate(meal._index, { name: e.target.value })}
                />
              </div>
              <div className="w-20">
                <Input
                  type="time"
                  value={meal.time}
                  onChange={(e) => onUpdate(meal._index, { time: e.target.value })}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(meal._index)}
              >
                ✕
              </Button>
            </div>
            <div className="flex gap-2">
              <div className="w-20">
                <Label className="text-xs">P (g)</Label>
                <Input
                  type="number"
                  value={meal.protein || ""}
                  onChange={(e) =>
                    onUpdate(meal._index, { protein: parseInt(e.target.value) || 0 })
                  }
                  className="font-mono h-8"
                />
              </div>
              <div className="w-20">
                <Label className="text-xs">C (g)</Label>
                <Input
                  type="number"
                  value={meal.carbs || ""}
                  onChange={(e) =>
                    onUpdate(meal._index, { carbs: parseInt(e.target.value) || 0 })
                  }
                  className="font-mono h-8"
                />
              </div>
              <div className="w-20">
                <Label className="text-xs">F (g)</Label>
                <Input
                  type="number"
                  value={meal.fat || ""}
                  onChange={(e) =>
                    onUpdate(meal._index, { fat: parseInt(e.target.value) || 0 })
                  }
                  className="font-mono h-8"
                />
              </div>
            </div>
            {/* Options */}
            <div className="space-y-1.5">
              {meal.options.map((opt, oi) => (
                <div key={oi} className="flex gap-2 items-center">
                  <span className="text-xs text-primary w-6">#{opt.optionNumber}</span>
                  <Input
                    placeholder="Opis opcije"
                    value={opt.description}
                    onChange={(e) => onUpdateOption(meal._index, oi, e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              ))}
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onAddOption(meal._index)}
              >
                + Opcija
              </Button>
            </div>
          </div>
        ))}
        <Button variant="outline" size="sm" onClick={onAdd}>
          + Obrok
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create nutrition editor page**

Create `src/app/(dashboard)/trainer/clients/[id]/nutrition/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";
import { getClientNutritionPlan } from "@/lib/queries/trainer";
import { NutritionEditor } from "@/components/trainer/nutrition-editor";
import { redirect } from "next/navigation";

export default async function NutritionEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TRAINER");
  const { id } = await params;
  const plan = await getClientNutritionPlan(session.user.id, id);

  const initialData = plan
    ? {
        name: plan.name,
        totalProtein: plan.totalProtein,
        totalCarbsTrain: plan.totalCarbsTrain,
        totalCarbsRest: plan.totalCarbsRest,
        totalFatTrain: plan.totalFatTrain,
        totalFatRest: plan.totalFatRest,
        totalKcalMin: plan.totalKcalMin,
        totalKcalMax: plan.totalKcalMax,
        rules: plan.rules,
        meals: plan.meals.map((m) => ({
          name: m.name,
          time: m.time,
          orderIndex: m.orderIndex,
          isTrainingDay: m.isTrainingDay,
          protein: m.protein,
          carbs: m.carbs,
          fat: m.fat,
          icon: m.icon ?? "🍽️",
          options: m.options.map((o) => ({
            optionNumber: o.optionNumber,
            description: o.description,
          })),
        })),
        supplements: plan.supplements.map((s) => ({
          name: s.name,
          dose: s.dose,
          timing: s.timing,
          icon: s.icon ?? "💊",
        })),
      }
    : null;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🍽️ Plan ishrane</h1>
      <NutritionEditor clientId={id} initialData={initialData} />
    </div>
  );
}
```

- [ ] **Step 3: Verify build**

```bash
pnpm build
```

- [ ] **Step 4: Commit**

```bash
git add src/components/trainer/nutrition-editor.tsx src/app/\(dashboard\)/trainer/clients/\[id\]/nutrition/
git commit -m "feat: nutrition plan editor for trainers"
```

---

### Task 5: Workout Plan Editor & Schedule Editor

**Files:**
- Create: `src/components/trainer/workout-editor.tsx`
- Create: `src/app/(dashboard)/trainer/clients/[id]/workout/page.tsx`
- Create: `src/components/trainer/schedule-editor.tsx`
- Create: `src/app/(dashboard)/trainer/clients/[id]/schedule/page.tsx`

- [ ] **Step 1: Create workout editor component**

Create `src/components/trainer/workout-editor.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface WarmupData {
  name: string;
  videoUrl: string;
  orderIndex: number;
}

interface ExerciseData {
  exerciseId: string;
  name: string;
  sets: string;
  note: string;
  videoUrl: string;
  orderIndex: number;
}

interface WorkoutData {
  name: string;
  focus: string;
  orderIndex: number;
  warmups: WarmupData[];
  exercises: ExerciseData[];
}

interface WorkoutEditorProps {
  clientId: string;
  planName: string;
  initialWorkouts: WorkoutData[];
}

export function WorkoutEditor({ clientId, planName, initialWorkouts }: WorkoutEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(planName);
  const [workouts, setWorkouts] = useState<WorkoutData[]>(initialWorkouts);

  function addWorkout() {
    setWorkouts((prev) => [
      ...prev,
      {
        name: `Trening ${String.fromCharCode(65 + prev.length)}`,
        focus: "",
        orderIndex: prev.length,
        warmups: [],
        exercises: [],
      },
    ]);
  }

  function updateWorkout(i: number, update: Partial<WorkoutData>) {
    setWorkouts((prev) => prev.map((w, idx) => (idx === i ? { ...w, ...update } : w)));
  }

  function removeWorkout(i: number) {
    setWorkouts((prev) => prev.filter((_, idx) => idx !== i));
  }

  function addWarmup(wi: number) {
    const w = workouts[wi];
    updateWorkout(wi, {
      warmups: [...w.warmups, { name: "", videoUrl: "", orderIndex: w.warmups.length }],
    });
  }

  function updateWarmup(wi: number, wui: number, update: Partial<WarmupData>) {
    const w = workouts[wi];
    updateWorkout(wi, {
      warmups: w.warmups.map((wu, i) => (i === wui ? { ...wu, ...update } : wu)),
    });
  }

  function addExercise(wi: number) {
    const w = workouts[wi];
    updateWorkout(wi, {
      exercises: [
        ...w.exercises,
        {
          exerciseId: `${String.fromCharCode(65 + w.exercises.length)}1`,
          name: "",
          sets: "2×12",
          note: "",
          videoUrl: "",
          orderIndex: w.exercises.length,
        },
      ],
    });
  }

  function updateExercise(wi: number, ei: number, update: Partial<ExerciseData>) {
    const w = workouts[wi];
    updateWorkout(wi, {
      exercises: w.exercises.map((ex, i) => (i === ei ? { ...ex, ...update } : ex)),
    });
  }

  async function savePlan() {
    setSaving(true);
    const res = await fetch("/api/trainer/workout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, name, workouts }),
    });
    setSaving(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5">
        <Label>Naziv plana</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} />
      </div>

      {workouts.map((w, wi) => (
        <div key={wi} className="rounded-xl border border-border bg-muted p-4 space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs">Naziv treninga</Label>
              <Input
                value={w.name}
                onChange={(e) => updateWorkout(wi, { name: e.target.value })}
              />
            </div>
            <div className="flex-1">
              <Label className="text-xs">Fokus</Label>
              <Input
                value={w.focus}
                onChange={(e) => updateWorkout(wi, { focus: e.target.value })}
              />
            </div>
            <Button variant="ghost" size="sm" onClick={() => removeWorkout(wi)}>
              ✕
            </Button>
          </div>

          {/* Warmups */}
          <div>
            <h4 className="text-sm font-medium text-warning mb-1.5">Aktivacije</h4>
            <div className="space-y-1.5">
              {w.warmups.map((wu, wui) => (
                <div key={wui} className="flex gap-2">
                  <Input
                    placeholder="npr. Cat-Cow 2×15"
                    value={wu.name}
                    onChange={(e) => updateWarmup(wi, wui, { name: e.target.value })}
                    className="h-8 text-sm"
                  />
                  <Input
                    placeholder="Video URL"
                    value={wu.videoUrl}
                    onChange={(e) => updateWarmup(wi, wui, { videoUrl: e.target.value })}
                    className="h-8 text-sm w-48"
                  />
                </div>
              ))}
              <Button variant="ghost" size="xs" onClick={() => addWarmup(wi)}>
                + Aktivacija
              </Button>
            </div>
          </div>

          {/* Exercises */}
          <div>
            <h4 className="text-sm font-medium text-primary mb-1.5">Vežbe</h4>
            <div className="space-y-2">
              {w.exercises.map((ex, ei) => (
                <div key={ei} className="flex gap-2 items-center flex-wrap">
                  <Input
                    placeholder="ID"
                    value={ex.exerciseId}
                    onChange={(e) => updateExercise(wi, ei, { exerciseId: e.target.value })}
                    className="h-8 text-sm w-14 font-mono"
                  />
                  <Input
                    placeholder="Naziv"
                    value={ex.name}
                    onChange={(e) => updateExercise(wi, ei, { name: e.target.value })}
                    className="h-8 text-sm flex-1 min-w-[140px]"
                  />
                  <Input
                    placeholder="Setovi"
                    value={ex.sets}
                    onChange={(e) => updateExercise(wi, ei, { sets: e.target.value })}
                    className="h-8 text-sm w-20 font-mono"
                  />
                  <Input
                    placeholder="Napomena"
                    value={ex.note}
                    onChange={(e) => updateExercise(wi, ei, { note: e.target.value })}
                    className="h-8 text-sm flex-1 min-w-[140px]"
                  />
                  <Input
                    placeholder="Video"
                    value={ex.videoUrl}
                    onChange={(e) => updateExercise(wi, ei, { videoUrl: e.target.value })}
                    className="h-8 text-sm w-48"
                  />
                </div>
              ))}
              <Button variant="ghost" size="xs" onClick={() => addExercise(wi)}>
                + Vežba
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Button variant="outline" onClick={addWorkout}>
        + Novi trening
      </Button>

      <Button className="w-full" size="lg" onClick={savePlan} disabled={saving}>
        {saving ? "Čuvanje..." : "Sačuvaj plan treninga"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 2: Create workout editor page**

Create `src/app/(dashboard)/trainer/clients/[id]/workout/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";
import { getClientWorkoutPlan } from "@/lib/queries/trainer";
import { WorkoutEditor } from "@/components/trainer/workout-editor";

export default async function WorkoutEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TRAINER");
  const { id } = await params;
  const plan = await getClientWorkoutPlan(session.user.id, id);

  const initialWorkouts = plan
    ? plan.workouts.map((w) => ({
        name: w.name,
        focus: w.focus,
        orderIndex: w.orderIndex,
        warmups: w.warmups.map((wu) => ({
          name: wu.name,
          videoUrl: wu.videoUrl ?? "",
          orderIndex: wu.orderIndex,
        })),
        exercises: w.exercises.map((ex) => ({
          exerciseId: ex.exerciseId,
          name: ex.name,
          sets: ex.sets,
          note: ex.note ?? "",
          videoUrl: ex.videoUrl ?? "",
          orderIndex: ex.orderIndex,
        })),
      }))
    : [];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">🏋️ Plan treninga</h1>
      <WorkoutEditor
        clientId={id}
        planName={plan?.name ?? ""}
        initialWorkouts={initialWorkouts}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create schedule editor component**

Create `src/components/trainer/schedule-editor.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const DAY_NAMES = [
  "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota", "Nedelja",
];

interface WorkoutOption {
  id: string;
  name: string;
}

interface ScheduleDay {
  dayOfWeek: number;
  dayName: string;
  type: "training" | "rest";
  workoutId: string | null;
  label: string;
  restNotes: string | null;
}

interface ScheduleEditorProps {
  planId: string;
  initialDays: ScheduleDay[];
  workouts: WorkoutOption[];
}

export function ScheduleEditor({ planId, initialDays, workouts }: ScheduleEditorProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [days, setDays] = useState<ScheduleDay[]>(
    initialDays.length === 7
      ? initialDays
      : DAY_NAMES.map((name, i) => ({
          dayOfWeek: i,
          dayName: name,
          type: "rest",
          workoutId: null,
          label: "Odmor / Šetnja",
          restNotes: null,
        }))
  );

  function updateDay(i: number, update: Partial<ScheduleDay>) {
    setDays((prev) => prev.map((d, idx) => (idx === i ? { ...d, ...update } : d)));
  }

  function toggleType(i: number) {
    const day = days[i];
    if (day.type === "training") {
      updateDay(i, {
        type: "rest",
        workoutId: null,
        label: "Odmor / Šetnja",
        restNotes: "Min 5000-7000 koraka",
      });
    } else {
      updateDay(i, {
        type: "training",
        workoutId: workouts[0]?.id ?? null,
        label: workouts[0]?.name ?? "Trening",
        restNotes: null,
      });
    }
  }

  async function saveSchedule() {
    setSaving(true);
    await fetch("/api/trainer/schedule", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId, days }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {days.map((day, i) => (
        <div
          key={i}
          className={`rounded-xl border p-3 ${
            day.type === "training"
              ? "border-primary/20 bg-primary/5"
              : "border-border bg-muted"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium">{day.dayName}</span>
            <Button
              variant={day.type === "training" ? "default" : "outline"}
              size="xs"
              onClick={() => toggleType(i)}
            >
              {day.type === "training" ? "🏋️ Trening" : "🌿 Odmor"}
            </Button>
          </div>

          {day.type === "training" ? (
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
              value={day.workoutId ?? ""}
              onChange={(e) => {
                const workout = workouts.find((w) => w.id === e.target.value);
                updateDay(i, {
                  workoutId: e.target.value || null,
                  label: workout?.name ?? "Trening",
                });
              }}
            >
              <option value="">Izaberi trening</option>
              {workouts.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          ) : (
            <Input
              placeholder="Napomena za dan odmora"
              value={day.restNotes ?? ""}
              onChange={(e) => updateDay(i, { restNotes: e.target.value || null })}
              className="h-8 text-sm"
            />
          )}
        </div>
      ))}

      <Button className="w-full" size="lg" onClick={saveSchedule} disabled={saving}>
        {saving ? "Čuvanje..." : "Sačuvaj raspored"}
      </Button>
    </div>
  );
}
```

- [ ] **Step 4: Create schedule editor page**

Create `src/app/(dashboard)/trainer/clients/[id]/schedule/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";
import { getClientWorkoutPlan } from "@/lib/queries/trainer";
import { ScheduleEditor } from "@/components/trainer/schedule-editor";
import { redirect } from "next/navigation";

export default async function ScheduleEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await requireRole("TRAINER");
  const { id } = await params;
  const plan = await getClientWorkoutPlan(session.user.id, id);

  if (!plan) {
    return (
      <div className="max-w-2xl mx-auto text-center py-12">
        <p className="text-muted-foreground">
          Nema aktivnog plana treninga. Prvo kreiraj plan treninga.
        </p>
      </div>
    );
  }

  const initialDays = plan.schedule.map((s) => ({
    dayOfWeek: s.dayOfWeek,
    dayName: s.dayName,
    type: s.type as "training" | "rest",
    workoutId: s.workoutId,
    label: s.label,
    restNotes: s.restNotes,
  }));

  const workoutOptions = plan.workouts.map((w) => ({
    id: w.id,
    name: w.name,
  }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">📅 Nedeljni raspored</h1>
      <ScheduleEditor
        planId={plan.id}
        initialDays={initialDays}
        workouts={workoutOptions}
      />
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
git add src/components/trainer/workout-editor.tsx src/components/trainer/schedule-editor.tsx src/app/\(dashboard\)/trainer/clients/\[id\]/workout/ src/app/\(dashboard\)/trainer/clients/\[id\]/schedule/
git commit -m "feat: workout plan editor and weekly schedule editor for trainers"
```

---

## Verification Checklist

After all tasks are complete:

1. `pnpm build` succeeds
2. Log in as `jovana@fittrack.rs` / `fittrack123`
3. `/trainer` — shows client list with Dušan Stanković
4. `/trainer/clients/[id]` — shows dashboard with weight, BMI, BF%, compliance grid, weight history, lab alerts, quick links
5. `/trainer/clients/[id]/nutrition` — shows nutrition editor pre-filled with current plan, can modify and save
6. `/trainer/clients/[id]/workout` — shows workout editor with 3 workouts (A/B/C), warmups, exercises
7. `/trainer/clients/[id]/schedule` — shows 7-day schedule with training/rest toggles and workout dropdown
