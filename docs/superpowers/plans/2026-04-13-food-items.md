# Food Items (Namirnice) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a global food items database with macro data, a CRUD page accessible to both roles, and integrate food items into meal options so trainers pick ingredients from the database and macros calculate automatically.

**Architecture:** New `FoodItem` and `MealOptionItem` Prisma models. Shared `/namirnice` page for CRUD. Modified nutrition editor replaces free-text options with ingredient picker. Client views show ingredient breakdown with calculated macros.

**Tech Stack:** Prisma (migration + seed), Next.js App Router, shadcn/ui (dialog, command/combobox), Zod validation, Tailwind CSS

---

### Task 1: Prisma Schema — FoodItem and MealOptionItem models

**Files:**
- Modify: `prisma/schema.prisma:89-96` (MealOption model)
- Modify: `prisma/schema.prisma` (add new models at end)

- [ ] **Step 1: Add FoodItem model to schema**

Add after `SupplementLog` model (end of file):

```prisma
model FoodItem {
  id            String   @id @default(cuid())
  name          String
  category      String?
  defaultGrams  Float    @default(100)
  defaultPieces Float?
  protein       Float
  carbs         Float
  fat           Float
  calories      Float
  measuredRaw   Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  mealOptionItems MealOptionItem[]
}

model MealOptionItem {
  id           String   @id @default(cuid())
  mealOptionId String
  foodItemId   String
  quantity     Float
  orderIndex   Int      @default(0)

  mealOption   MealOption @relation(fields: [mealOptionId], references: [id], onDelete: Cascade)
  foodItem     FoodItem   @relation(fields: [foodItemId], references: [id], onDelete: Restrict)
}
```

- [ ] **Step 2: Add items relation to MealOption model**

In the `MealOption` model (line 89-96), add the relation:

```prisma
model MealOption {
  id           String   @id @default(cuid())
  mealId       String
  optionNumber Int
  description  String

  meal         Meal     @relation(fields: [mealId], references: [id], onDelete: Cascade)
  items        MealOptionItem[]
}
```

- [ ] **Step 3: Run migration**

Run: `pnpm prisma migrate dev --name add-food-items`
Expected: Migration creates `FoodItem` and `MealOptionItem` tables successfully.

- [ ] **Step 4: Regenerate Prisma client**

Run: `pnpm prisma generate`
Expected: Prisma Client generated successfully.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat: add FoodItem and MealOptionItem models"
```

---

### Task 2: Seed food items data

**Files:**
- Modify: `prisma/seed.ts`

- [ ] **Step 1: Add food items seed data**

Add after the `const hashedPassword` line and before the Users section. These are the common ingredients from existing meal descriptions, with realistic macro values per 100g:

```typescript
// ─── FOOD ITEMS ────────────────────────────────────────────
const foodItemsData = [
  // Meso
  { name: "Piletina bela (grudi)", category: "Meso", defaultGrams: 100, protein: 31, carbs: 0, fat: 3.6, calories: 165, measuredRaw: false },
  { name: "Crveno meso (govedina)", category: "Meso", defaultGrams: 100, protein: 26, carbs: 0, fat: 15, calories: 250, measuredRaw: false },
  { name: "Biftek", category: "Meso", defaultGrams: 150, protein: 28, carbs: 0, fat: 6, calories: 172, measuredRaw: false },
  { name: "Tunjevina (konzerva)", category: "Meso", defaultGrams: 100, protein: 26, carbs: 0, fat: 1, calories: 116, measuredRaw: false },
  // Jaja i mlečni
  { name: "Jaje", category: "Jaja i mlečni", defaultGrams: 60, defaultPieces: 1, protein: 13, carbs: 1.1, fat: 11, calories: 155, measuredRaw: true },
  { name: "Mladi sir", category: "Jaja i mlečni", defaultGrams: 100, protein: 11, carbs: 3.4, fat: 4, calories: 98, measuredRaw: false },
  { name: "Proteinski jogurt/skyr", category: "Jaja i mlečni", defaultGrams: 150, defaultPieces: 1, protein: 10, carbs: 4, fat: 0.2, calories: 57, measuredRaw: false },
  { name: "Grčki jogurt", category: "Jaja i mlečni", defaultGrams: 150, protein: 9, carbs: 3.6, fat: 5, calories: 97, measuredRaw: false },
  // Ugljeni hidrati
  { name: "Krompir", category: "Ugljeni hidrati", defaultGrams: 100, protein: 2, carbs: 17, fat: 0.1, calories: 77, measuredRaw: false },
  { name: "Pirinač (beli)", category: "Ugljeni hidrati", defaultGrams: 100, protein: 2.7, carbs: 28, fat: 0.3, calories: 130, measuredRaw: false },
  { name: "Integralni hleb", category: "Ugljeni hidrati", defaultGrams: 60, defaultPieces: 2, protein: 13, carbs: 43, fat: 3.4, calories: 247, measuredRaw: false },
  { name: "Ovsene pahuljice", category: "Ugljeni hidrati", defaultGrams: 100, protein: 13, carbs: 66, fat: 7, calories: 379, measuredRaw: true },
  { name: "Banana", category: "Voće", defaultGrams: 120, defaultPieces: 1, protein: 1.1, carbs: 23, fat: 0.3, calories: 89, measuredRaw: true },
  { name: "Tost hleb", category: "Ugljeni hidrati", defaultGrams: 30, defaultPieces: 1, protein: 8, carbs: 49, fat: 3.5, calories: 261, measuredRaw: false },
  // Masti i ulja
  { name: "Maslinovo ulje", category: "Masti i ulja", defaultGrams: 10, protein: 0, carbs: 0, fat: 100, calories: 884, measuredRaw: true },
  { name: "Kikiriki puter", category: "Masti i ulja", defaultGrams: 15, protein: 25, carbs: 20, fat: 50, calories: 588, measuredRaw: false },
  { name: "Badem", category: "Orašasti plodovi", defaultGrams: 40, protein: 21, carbs: 22, fat: 49, calories: 579, measuredRaw: true },
  // Voće i povrće
  { name: "Borovnice", category: "Voće", defaultGrams: 100, protein: 0.7, carbs: 14, fat: 0.3, calories: 57, measuredRaw: true },
  { name: "Zeleno povrće", category: "Povrće", defaultGrams: 100, protein: 2.9, carbs: 3.6, fat: 0.4, calories: 34, measuredRaw: false },
  { name: "Salata (mešana)", category: "Povrće", defaultGrams: 100, protein: 1.3, carbs: 2.2, fat: 0.2, calories: 15, measuredRaw: true },
  // Suplementi
  { name: "Whey protein", category: "Suplementi", defaultGrams: 30, protein: 80, carbs: 8, fat: 3, calories: 380, measuredRaw: true },
  { name: "EAA", category: "Suplementi", defaultGrams: 15, protein: 90, carbs: 0, fat: 0, calories: 360, measuredRaw: true },
  { name: "Kreatin", category: "Suplementi", defaultGrams: 5, protein: 0, carbs: 0, fat: 0, calories: 0, measuredRaw: true },
];
```

- [ ] **Step 2: Add cleanup and create calls for FoodItem**

Add `await prisma.mealOptionItem.deleteMany();` and `await prisma.foodItem.deleteMany();` to the cleanup section at the top (before `mealOption.deleteMany()`).

Then after the `foodItemsData` definition, create the items:

```typescript
const foodItems: Record<string, string> = {};
for (const item of foodItemsData) {
  const created = await prisma.foodItem.create({ data: item });
  foodItems[item.name] = created.id;
}
```

- [ ] **Step 3: Link meal options to food items**

After creating meals, add `MealOptionItem` links for the structured meal options. Add this after the meal creation loop (after `for (const meal of [...trainingMeals, ...restMeals])` block):

```typescript
// ─── LINK MEAL OPTIONS TO FOOD ITEMS ──────────────────────
// Fetch created meals with options to get IDs
const createdMeals = await prisma.meal.findMany({
  where: { planId: nutritionPlan.id },
  include: { options: true },
  orderBy: [{ isTrainingDay: "desc" }, { orderIndex: "asc" }],
});

// Helper to find meal option by meal name + option number
function findOption(mealName: string, isTraining: boolean, optNum: number) {
  const meal = createdMeals.find(
    (m) => m.name === mealName && m.isTrainingDay === isTraining
  );
  return meal?.options.find((o) => o.optionNumber === optNum);
}

// Define ingredient links: [mealName, isTraining, optionNumber, foodItemName, quantityGrams]
type IngredientLink = [string, boolean, number, string, number];
const ingredientLinks: IngredientLink[] = [
  // Training: Post workout opt 1
  ["Post workout (Obrok 1)", true, 1, "Whey protein", 30],
  ["Post workout (Obrok 1)", true, 1, "Banana", 200],
  // Training: Ručak opt 1
  ["Ručak (Obrok 2)", true, 1, "Piletina bela (grudi)", 250],
  ["Ručak (Obrok 2)", true, 1, "Krompir", 250],
  ["Ručak (Obrok 2)", true, 1, "Salata (mešana)", 100],
  ["Ručak (Obrok 2)", true, 1, "Maslinovo ulje", 20],
  // Training: Ručak opt 2
  ["Ručak (Obrok 2)", true, 2, "Crveno meso (govedina)", 200],
  ["Ručak (Obrok 2)", true, 2, "Krompir", 250],
  ["Ručak (Obrok 2)", true, 2, "Salata (mešana)", 100],
  ["Ručak (Obrok 2)", true, 2, "Maslinovo ulje", 20],
  // Training: Užina opt 1
  ["Užina (Obrok 3)", true, 1, "Tunjevina (konzerva)", 100],
  ["Užina (Obrok 3)", true, 1, "Integralni hleb", 60],
  ["Užina (Obrok 3)", true, 1, "Mladi sir", 50],
  ["Užina (Obrok 3)", true, 1, "Salata (mešana)", 100],
  ["Užina (Obrok 3)", true, 1, "Maslinovo ulje", 10],
  // Training: Užina opt 3
  ["Užina (Obrok 3)", true, 3, "Proteinski jogurt/skyr", 300],
  ["Užina (Obrok 3)", true, 3, "Borovnice", 100],
  ["Užina (Obrok 3)", true, 3, "Badem", 40],
  // Training: Večera opt 1
  ["Večera (Obrok 4)", true, 1, "Piletina bela (grudi)", 200],
  ["Večera (Obrok 4)", true, 1, "Krompir", 150],
  ["Večera (Obrok 4)", true, 1, "Zeleno povrće", 100],
  ["Večera (Obrok 4)", true, 1, "Maslinovo ulje", 15],
  // Training: Večera opt 2
  ["Večera (Obrok 4)", true, 2, "Tunjevina (konzerva)", 100],
  ["Večera (Obrok 4)", true, 2, "Jaje", 120],
  ["Večera (Obrok 4)", true, 2, "Pirinač (beli)", 80],
  ["Večera (Obrok 4)", true, 2, "Zeleno povrće", 100],
  // Training: Večera opt 3
  ["Večera (Obrok 4)", true, 3, "Biftek", 150],
  ["Večera (Obrok 4)", true, 3, "Krompir", 200],
  ["Večera (Obrok 4)", true, 3, "Salata (mešana)", 100],
];

// Also link the same for rest day meals that share the same options
const restIngredientLinks: IngredientLink[] = [
  // Rest: Doručak opt 2
  ["Doručak", false, 2, "Proteinski jogurt/skyr", 150],
  ["Doručak", false, 2, "Borovnice", 100],
  ["Doručak", false, 2, "Badem", 30],
  // Rest: Doručak opt 3
  ["Doručak", false, 3, "Grčki jogurt", 150],
  ["Doručak", false, 3, "Whey protein", 15],
  ["Doručak", false, 3, "Kikiriki puter", 15],
  ["Doručak", false, 3, "Borovnice", 100],
  // Rest: Ručak opt 1
  ["Ručak (Obrok 2)", false, 1, "Piletina bela (grudi)", 250],
  ["Ručak (Obrok 2)", false, 1, "Krompir", 250],
  ["Ručak (Obrok 2)", false, 1, "Salata (mešana)", 100],
  ["Ručak (Obrok 2)", false, 1, "Maslinovo ulje", 20],
  // Rest: Ručak opt 2
  ["Ručak (Obrok 2)", false, 2, "Crveno meso (govedina)", 200],
  ["Ručak (Obrok 2)", false, 2, "Krompir", 250],
  ["Ručak (Obrok 2)", false, 2, "Salata (mešana)", 100],
  ["Ručak (Obrok 2)", false, 2, "Maslinovo ulje", 20],
  // Rest: Užina opt 1
  ["Užina (Obrok 3)", false, 1, "Tunjevina (konzerva)", 100],
  ["Užina (Obrok 3)", false, 1, "Integralni hleb", 60],
  ["Užina (Obrok 3)", false, 1, "Mladi sir", 50],
  ["Užina (Obrok 3)", false, 1, "Salata (mešana)", 100],
  ["Užina (Obrok 3)", false, 1, "Maslinovo ulje", 10],
  // Rest: Užina opt 3
  ["Užina (Obrok 3)", false, 3, "Proteinski jogurt/skyr", 300],
  ["Užina (Obrok 3)", false, 3, "Borovnice", 100],
  ["Užina (Obrok 3)", false, 3, "Badem", 40],
  // Rest: Večera opt 1
  ["Večera (Obrok 4)", false, 1, "Piletina bela (grudi)", 200],
  ["Večera (Obrok 4)", false, 1, "Krompir", 150],
  ["Večera (Obrok 4)", false, 1, "Zeleno povrće", 100],
  ["Večera (Obrok 4)", false, 1, "Maslinovo ulje", 15],
  // Rest: Večera opt 2
  ["Večera (Obrok 4)", false, 2, "Tunjevina (konzerva)", 100],
  ["Večera (Obrok 4)", false, 2, "Jaje", 120],
  ["Večera (Obrok 4)", false, 2, "Pirinač (beli)", 80],
  ["Večera (Obrok 4)", false, 2, "Zeleno povrće", 100],
  // Rest: Večera opt 3
  ["Večera (Obrok 4)", false, 3, "Biftek", 150],
  ["Večera (Obrok 4)", false, 3, "Krompir", 200],
  ["Večera (Obrok 4)", false, 3, "Salata (mešana)", 100],
];

for (const [mealName, isTraining, optNum, foodName, qty] of [
  ...ingredientLinks,
  ...restIngredientLinks,
]) {
  const option = findOption(mealName, isTraining, optNum);
  const foodItemId = foodItems[foodName];
  if (option && foodItemId) {
    await prisma.mealOptionItem.create({
      data: {
        mealOptionId: option.id,
        foodItemId,
        quantity: qty,
        orderIndex: 0,
      },
    });
  }
}
```

- [ ] **Step 4: Run seed to verify**

Run: `pnpm prisma db seed`
Expected: Seed completes successfully with food items and ingredient links created.

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts
git commit -m "feat: seed food items and link to meal options"
```

---

### Task 3: Food Items API routes

**Files:**
- Create: `src/app/api/food-items/route.ts`

- [ ] **Step 1: Create the GET and POST route**

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const foodItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().nullable().optional(),
  defaultGrams: z.number().positive().default(100),
  defaultPieces: z.number().positive().nullable().optional(),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  calories: z.number().min(0),
  measuredRaw: z.boolean().default(true),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (category) {
    where.category = category;
  }

  const items = await prisma.foodItem.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = foodItemSchema.parse(body);
    const item = await prisma.foodItem.create({ data });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Create the PUT and DELETE route for individual items**

Create: `src/app/api/food-items/[id]/route.ts`

```typescript
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const foodItemUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().nullable().optional(),
  defaultGrams: z.number().positive().optional(),
  defaultPieces: z.number().positive().nullable().optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  calories: z.number().min(0).optional(),
  measuredRaw: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const data = foodItemUpdateSchema.parse(body);
    const item = await prisma.foodItem.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const { id } = await params;
    // Check if food item is used in any meal option
    const usageCount = await prisma.mealOptionItem.count({
      where: { foodItemId: id },
    });
    if (usageCount > 0) {
      return NextResponse.json(
        { error: "Namirnica se koristi u obroku i ne može se obrisati" },
        { status: 409 }
      );
    }
    await prisma.foodItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

- [ ] **Step 3: Verify API works**

Run: `curl http://localhost:3000/api/food-items` (will return 401 since no auth — that's expected)

- [ ] **Step 4: Commit**

```bash
git add src/app/api/food-items/
git commit -m "feat: food items CRUD API routes"
```

---

### Task 4: Install required shadcn components

**Files:**
- Create/modify: `src/components/ui/dialog.tsx`, `src/components/ui/table.tsx`, `src/components/ui/select.tsx`, `src/components/ui/badge.tsx`, `src/components/ui/command.tsx`, `src/components/ui/popover.tsx`

- [ ] **Step 1: Install shadcn components**

Run: `pnpm dlx shadcn@latest add dialog table select badge command popover`
Expected: Components installed in `src/components/ui/`

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/
git commit -m "feat: install shadcn dialog, table, select, badge, command, popover"
```

---

### Task 5: Food Items CRUD page

**Files:**
- Create: `src/app/(dashboard)/namirnice/page.tsx`
- Create: `src/components/food/food-items-table.tsx`
- Create: `src/components/food/food-item-dialog.tsx`
- Modify: `src/components/layout/sidebar.tsx`

- [ ] **Step 1: Add sidebar link for both roles**

In `src/components/layout/sidebar.tsx`, add to `clientLinks` after the "Ishrana" entry:

```typescript
{ href: "/namirnice", label: "Namirnice", icon: "🥘" },
```

Add to `trainerLinks`:

```typescript
{ href: "/namirnice", label: "Namirnice", icon: "🥘" },
```

- [ ] **Step 2: Create the food item form dialog component**

Create `src/components/food/food-item-dialog.tsx`:

```tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface FoodItemData {
  id?: string;
  name: string;
  category: string;
  defaultGrams: number;
  defaultPieces: number | null;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  measuredRaw: boolean;
}

interface FoodItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: FoodItemData | null;
  onSaved: () => void;
}

const CATEGORIES = [
  "Meso",
  "Jaja i mlečni",
  "Ugljeni hidrati",
  "Masti i ulja",
  "Orašasti plodovi",
  "Voće",
  "Povrće",
  "Suplementi",
];

const emptyItem: FoodItemData = {
  name: "",
  category: "",
  defaultGrams: 100,
  defaultPieces: null,
  protein: 0,
  carbs: 0,
  fat: 0,
  calories: 0,
  measuredRaw: true,
};

export function FoodItemDialog({
  open,
  onOpenChange,
  item,
  onSaved,
}: FoodItemDialogProps) {
  const [form, setForm] = useState<FoodItemData>(emptyItem);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setForm(item ?? emptyItem);
      setError("");
    }
  }, [open, item]);

  function update<K extends keyof FoodItemData>(key: K, value: FoodItemData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError("");
    try {
      const url = form.id ? `/api/food-items/${form.id}` : "/api/food-items";
      const method = form.id ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          category: form.category || null,
          defaultGrams: form.defaultGrams,
          defaultPieces: form.defaultPieces || null,
          protein: form.protein,
          carbs: form.carbs,
          fat: form.fat,
          calories: form.calories,
          measuredRaw: form.measuredRaw,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Greška");
        return;
      }
      onSaved();
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {form.id ? "Izmeni namirnicu" : "Nova namirnica"}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Naziv</Label>
            <Input
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="npr. Piletina bela (grudi)"
            />
          </div>
          <div className="space-y-1">
            <Label>Kategorija</Label>
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              value={form.category}
              onChange={(e) => update("category", e.target.value)}
            >
              <option value="">Bez kategorije</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Osnovna mera (g)</Label>
              <Input
                type="number"
                value={form.defaultGrams || ""}
                onChange={(e) => update("defaultGrams", parseFloat(e.target.value) || 100)}
                className="font-mono"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Komada (opciono)</Label>
              <Input
                type="number"
                value={form.defaultPieces ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  update("defaultPieces", v === "" ? null : parseFloat(v));
                }}
                className="font-mono"
                placeholder="-"
              />
            </div>
          </div>
          <div className="text-xs font-semibold text-muted-foreground mt-2">
            Makro vrednosti na 100g
          </div>
          <div className="grid grid-cols-4 gap-2">
            <div className="space-y-1">
              <Label className="text-xs">P (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.protein || ""}
                onChange={(e) => update("protein", parseFloat(e.target.value) || 0)}
                className="font-mono h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">C (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.carbs || ""}
                onChange={(e) => update("carbs", parseFloat(e.target.value) || 0)}
                className="font-mono h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">F (g)</Label>
              <Input
                type="number"
                step="0.1"
                value={form.fat || ""}
                onChange={(e) => update("fat", parseFloat(e.target.value) || 0)}
                className="font-mono h-8"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">kcal</Label>
              <Input
                type="number"
                value={form.calories || ""}
                onChange={(e) => update("calories", parseFloat(e.target.value) || 0)}
                className="font-mono h-8"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="measuredRaw"
              checked={form.measuredRaw}
              onChange={(e) => update("measuredRaw", e.target.checked)}
              className="rounded border-border"
            />
            <Label htmlFor="measuredRaw" className="text-sm">
              Meri se sirovo
            </Label>
          </div>
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          <Button className="w-full" onClick={handleSave} disabled={saving || !form.name}>
            {saving ? "Čuvanje..." : form.id ? "Sačuvaj izmene" : "Dodaj namirnicu"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 3: Create the food items table component**

Create `src/components/food/food-items-table.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FoodItemDialog } from "./food-item-dialog";

interface FoodItem {
  id: string;
  name: string;
  category: string | null;
  defaultGrams: number;
  defaultPieces: number | null;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  measuredRaw: boolean;
}

export function FoodItemsTable() {
  const [items, setItems] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<FoodItem | null>(null);
  const [deleteError, setDeleteError] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/food-items?${params}`);
    if (res.ok) {
      setItems(await res.json());
    }
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 300);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  function openNew() {
    setEditItem(null);
    setDialogOpen(true);
  }

  function openEdit(item: FoodItem) {
    setEditItem(item);
    setDialogOpen(true);
  }

  async function handleDelete(id: string) {
    setDeleteError("");
    const res = await fetch(`/api/food-items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error || "Greška pri brisanju");
      return;
    }
    fetchItems();
  }

  // Group by category
  const grouped = items.reduce<Record<string, FoodItem[]>>((acc, item) => {
    const cat = item.category || "Ostalo";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Pretraži namirnice..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <Button onClick={openNew}>+ Nova namirnica</Button>
      </div>

      {deleteError && (
        <div className="text-sm text-destructive bg-destructive/10 rounded-lg p-2">
          {deleteError}
        </div>
      )}

      {loading ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          Učitavanje...
        </div>
      ) : items.length === 0 ? (
        <div className="text-sm text-muted-foreground py-8 text-center">
          {search ? "Nema rezultata" : "Nema namirnica. Dodajte prvu!"}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([category, catItems]) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {category}
              </h3>
              <div className="space-y-1">
                {catItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border border-border bg-card p-3 hover:bg-accent/50 cursor-pointer transition-colors"
                    onClick={() => openEdit(item)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {item.name}
                      </div>
                      <div className="flex gap-2 mt-0.5 text-xs text-muted-foreground">
                        <span>{item.defaultGrams}g</span>
                        {item.defaultPieces && (
                          <span>({item.defaultPieces} kom)</span>
                        )}
                        <Badge variant="outline" className="text-[10px] px-1 py-0">
                          {item.measuredRaw ? "sirovo" : "obrađeno"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-3 text-xs font-mono shrink-0">
                      <span className="text-secondary">P:{item.protein}g</span>
                      <span className="text-warning">C:{item.carbs}g</span>
                      <span className="text-success">F:{item.fat}g</span>
                      <span className="text-muted-foreground">
                        {item.calories}kcal
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0 text-destructive hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id);
                      }}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <FoodItemDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editItem}
        onSaved={fetchItems}
      />
    </div>
  );
}
```

- [ ] **Step 4: Create the page**

Create `src/app/(dashboard)/namirnice/page.tsx`:

```tsx
import { requireAuth } from "@/lib/auth-utils";
import { FoodItemsTable } from "@/components/food/food-items-table";

export default async function NamirnicePage() {
  await requireAuth();

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-xl font-semibold">🥘 Namirnice</h1>
      <p className="text-sm text-muted-foreground">
        Spisak namirnica sa makro vrednostima na 100g. Koristi se za kreiranje obroka.
      </p>
      <FoodItemsTable />
    </div>
  );
}
```

- [ ] **Step 5: Verify the page works**

Open http://localhost:3000/namirnice — should show the seeded food items grouped by category, with search and add/edit/delete functionality.

- [ ] **Step 6: Commit**

```bash
git add src/app/\(dashboard\)/namirnice/ src/components/food/ src/components/layout/sidebar.tsx
git commit -m "feat: food items CRUD page with search and categories"
```

---

### Task 6: Ingredient picker for nutrition editor

**Files:**
- Create: `src/components/food/ingredient-picker.tsx`
- Modify: `src/components/trainer/nutrition-editor.tsx`
- Modify: `src/app/api/trainer/nutrition/route.ts`

- [ ] **Step 1: Create the ingredient picker component**

Create `src/components/food/ingredient-picker.tsx`:

```tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FoodItem {
  id: string;
  name: string;
  category: string | null;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
  defaultGrams: number;
  measuredRaw: boolean;
}

export interface IngredientItem {
  foodItemId: string;
  foodItemName: string;
  quantity: number;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

interface IngredientPickerProps {
  items: IngredientItem[];
  onChange: (items: IngredientItem[]) => void;
}

function calcMacros(food: FoodItem, quantity: number) {
  const factor = quantity / 100;
  return {
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
    calories: Math.round(food.calories * factor),
  };
}

export function IngredientPicker({ items, onChange }: IngredientPickerProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFood = useCallback(async (q: string) => {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    const res = await fetch(`/api/food-items?${params}`);
    if (res.ok) setFoodItems(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => fetchFood(search), 200);
      return () => clearTimeout(timer);
    }
  }, [search, searchOpen, fetchFood]);

  function addIngredient(food: FoodItem) {
    const macros = calcMacros(food, food.defaultGrams);
    onChange([
      ...items,
      {
        foodItemId: food.id,
        foodItemName: food.name,
        quantity: food.defaultGrams,
        ...macros,
      },
    ]);
    setSearchOpen(false);
    setSearch("");
  }

  function updateQuantity(index: number, quantity: number) {
    const item = items[index];
    // Re-fetch the food item macros from the current list or recalculate
    const food = foodItems.find((f) => f.id === item.foodItemId);
    if (food) {
      const macros = calcMacros(food, quantity);
      onChange(items.map((it, i) => (i === index ? { ...it, quantity, ...macros } : it)));
    } else {
      // Approximate: scale from current values
      const factor = quantity / (item.quantity || 1);
      onChange(
        items.map((it, i) =>
          i === index
            ? {
                ...it,
                quantity,
                protein: Math.round(it.protein * factor * 10) / 10,
                carbs: Math.round(it.carbs * factor * 10) / 10,
                fat: Math.round(it.fat * factor * 10) / 10,
                calories: Math.round(it.calories * factor),
              }
            : it
        )
      );
    }
  }

  function removeIngredient(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const totals = items.reduce(
    (acc, it) => ({
      protein: acc.protein + it.protein,
      carbs: acc.carbs + it.carbs,
      fat: acc.fat + it.fat,
      calories: acc.calories + it.calories,
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  );

  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-2 text-xs">
          <span className="flex-1 truncate text-foreground">{item.foodItemName}</span>
          <Input
            type="number"
            value={item.quantity || ""}
            onChange={(e) => updateQuantity(i, parseFloat(e.target.value) || 0)}
            className="w-16 h-7 font-mono text-xs"
          />
          <span className="text-muted-foreground w-4">g</span>
          <span className="font-mono text-muted-foreground w-24 text-right">
            P:{item.protein} C:{item.carbs} F:{item.fat}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => removeIngredient(i)}
          >
            ✕
          </Button>
        </div>
      ))}

      {items.length > 0 && (
        <div className="flex gap-2 text-xs font-mono pt-1 border-t border-border">
          <span className="text-secondary">P:{Math.round(totals.protein)}g</span>
          <span className="text-warning">C:{Math.round(totals.carbs)}g</span>
          <span className="text-success">F:{Math.round(totals.fat)}g</span>
          <span className="text-muted-foreground">{totals.calories}kcal</span>
        </div>
      )}

      <Popover open={searchOpen} onOpenChange={setSearchOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="text-xs">
            + Namirnica
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <Input
            placeholder="Pretraži..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-8 text-sm mb-2"
            autoFocus
          />
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {loading ? (
              <div className="text-xs text-muted-foreground p-2">Učitavanje...</div>
            ) : foodItems.length === 0 ? (
              <div className="text-xs text-muted-foreground p-2">Nema rezultata</div>
            ) : (
              foodItems.map((food) => (
                <button
                  key={food.id}
                  className="w-full text-left px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors"
                  onClick={() => addIngredient(food)}
                >
                  <div className="font-medium">{food.name}</div>
                  <div className="text-muted-foreground font-mono">
                    {food.defaultGrams}g — P:{food.protein} C:{food.carbs} F:{food.fat}
                  </div>
                </button>
              ))
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
```

- [ ] **Step 2: Update nutrition editor interfaces and option state**

In `src/components/trainer/nutrition-editor.tsx`, update the `MealOption` interface and add `IngredientItem`:

Replace the existing `MealOption` interface (line 9-12):

```typescript
interface IngredientItemData {
  foodItemId: string;
  foodItemName: string;
  quantity: number;
  protein: number;
  carbs: number;
  fat: number;
  calories: number;
}

interface MealOption {
  optionNumber: number;
  description: string;
  ingredients: IngredientItemData[];
}
```

Add the import at the top:

```typescript
import { IngredientPicker, IngredientItem } from "@/components/food/ingredient-picker";
```

- [ ] **Step 3: Update addOption to include empty ingredients array**

Update the `addOption` function:

```typescript
function addOption(mealIndex: number) {
  const meal = plan.meals[mealIndex];
  const newOpt: MealOption = {
    optionNumber: meal.options.length + 1,
    description: "",
    ingredients: [],
  };
  updateMeal(mealIndex, { options: [...meal.options, newOpt] });
}
```

Update `addMeal` default option:

```typescript
options: [{ optionNumber: 1, description: "", ingredients: [] }],
```

- [ ] **Step 4: Add updateOptionIngredients function and auto-generate description**

Add a new function after `updateOption`:

```typescript
function updateOptionIngredients(
  mealIndex: number,
  optIndex: number,
  ingredients: IngredientItemData[]
) {
  const meal = plan.meals[mealIndex];
  const description = ingredients
    .map((ing) => `${ing.quantity}g ${ing.foodItemName}`)
    .join(" + ");
  const options = meal.options.map((o, i) =>
    i === optIndex ? { ...o, ingredients, description } : o
  );
  updateMeal(mealIndex, { options });
}
```

- [ ] **Step 5: Replace text input with ingredient picker in MealSection**

In the `MealSection` component, update the props to accept the new handler:

```typescript
function MealSection({
  title,
  meals,
  onUpdate,
  onRemove,
  onAddOption,
  onUpdateOptionIngredients,
  onAdd,
}: {
  title: string;
  meals: MealWithIndex[];
  onUpdate: (index: number, update: Partial<MealData>) => void;
  onRemove: (index: number) => void;
  onAddOption: (mealIndex: number) => void;
  onUpdateOptionIngredients: (mealIndex: number, optIndex: number, ingredients: IngredientItemData[]) => void;
  onAdd: () => void;
}) {
```

Replace the options rendering section (the `meal.options.map` block, lines 443-453) with:

```tsx
{meal.options.map((opt, oi) => (
  <div key={oi} className="space-y-1 border-l-2 border-primary/30 pl-2">
    <span className="text-xs text-primary font-medium">#{opt.optionNumber}</span>
    <IngredientPicker
      items={opt.ingredients}
      onChange={(ingredients) =>
        onUpdateOptionIngredients(meal._index, oi, ingredients)
      }
    />
  </div>
))}
```

- [ ] **Step 6: Update MealSection usage in the return JSX**

Replace both `<MealSection>` instances to pass the new prop. Remove `onUpdateOption` and add `onUpdateOptionIngredients`:

```tsx
<MealSection
  title="Obroci — Trening dan"
  meals={trainingMeals}
  onUpdate={updateMeal}
  onRemove={removeMeal}
  onAddOption={addOption}
  onUpdateOptionIngredients={updateOptionIngredients}
  onAdd={() => addMeal(true)}
/>

<MealSection
  title="Obroci — Dan odmora"
  meals={restMeals}
  onUpdate={updateMeal}
  onRemove={removeMeal}
  onAddOption={addOption}
  onUpdateOptionIngredients={updateOptionIngredients}
  onAdd={() => addMeal(false)}
/>
```

Remove the `updateOption` function (no longer needed since we removed the text input).

- [ ] **Step 7: Update the API route to handle ingredients**

In `src/app/api/trainer/nutrition/route.ts`, update the `mealOptionSchema`:

```typescript
const ingredientItemSchema = z.object({
  foodItemId: z.string(),
  quantity: z.number().positive(),
});

const mealOptionSchema = z.object({
  optionNumber: z.number().int().positive(),
  description: z.string(),
  ingredients: z.array(ingredientItemSchema).default([]),
});
```

Update the meal creation in the `POST` handler. Replace the `options: { create: meal.options }` line:

```typescript
options: {
  create: meal.options.map((opt) => ({
    optionNumber: opt.optionNumber,
    description: opt.description,
    items: {
      create: opt.ingredients.map((ing, idx) => ({
        foodItemId: ing.foodItemId,
        quantity: ing.quantity,
        orderIndex: idx,
      })),
    },
  })),
},
```

Also update the include at the end to include items:

```typescript
include: {
  meals: {
    include: {
      options: {
        include: { items: { include: { foodItem: true } } },
      },
    },
  },
  supplements: true,
},
```

- [ ] **Step 8: Verify the nutrition editor works**

Login as trainer (jovana@fittrack.rs), open a client's nutrition page, and use the nutrition editor. Each meal option should show the ingredient picker instead of a text input. Adding ingredients should show calculated macros.

- [ ] **Step 9: Commit**

```bash
git add src/components/food/ingredient-picker.tsx src/components/trainer/nutrition-editor.tsx src/app/api/trainer/nutrition/route.ts
git commit -m "feat: ingredient picker in nutrition editor with auto macro calculation"
```

---

### Task 7: Show ingredient breakdown in client nutrition view

**Files:**
- Modify: `src/app/(dashboard)/client/nutrition/page.tsx`
- Modify: `src/lib/queries/schedule.ts`

- [ ] **Step 1: Update schedule query to include meal option items**

In `src/lib/queries/schedule.ts`, in both `getTodaySchedule` and `getWeekSchedule`, update the `nutritionPlan` query to include `items` in the `options` include:

In `getTodaySchedule` (around line 14):

```typescript
meals: {
  include: {
    options: {
      orderBy: { optionNumber: "asc" },
      include: {
        items: {
          include: { foodItem: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    },
  },
  orderBy: { orderIndex: "asc" },
},
```

In `getWeekSchedule` (around line 89):

```typescript
meals: {
  include: {
    options: {
      orderBy: { optionNumber: "asc" },
      include: {
        items: {
          include: { foodItem: true },
          orderBy: { orderIndex: "asc" },
        },
      },
    },
  },
  orderBy: { orderIndex: "asc" },
},
```

- [ ] **Step 2: Update client nutrition page to show ingredients**

In `src/app/(dashboard)/client/nutrition/page.tsx`, replace the meal option rendering (lines 53-62):

```tsx
{meal.options.map((opt) => (
  <div key={opt.id}>
    <span className="text-xs font-medium text-primary">
      Opcija {opt.optionNumber}
    </span>
    {opt.items && opt.items.length > 0 ? (
      <div className="text-sm mt-0.5 rounded-md bg-card p-2 space-y-1">
        {opt.items.map((item: { id: string; quantity: number; foodItem: { name: string; protein: number; carbs: number; fat: number; calories: number; measuredRaw: boolean } }) => {
          const factor = item.quantity / 100;
          return (
            <div key={item.id} className="flex items-center justify-between text-xs">
              <span>
                {item.quantity}g {item.foodItem.name}
                {item.foodItem.measuredRaw ? "" : " *"}
              </span>
              <span className="font-mono text-muted-foreground">
                P:{Math.round(item.foodItem.protein * factor)}
                C:{Math.round(item.foodItem.carbs * factor)}
                F:{Math.round(item.foodItem.fat * factor)}
              </span>
            </div>
          );
        })}
      </div>
    ) : (
      <div className="text-sm text-foreground mt-0.5 rounded-md bg-card p-2">
        {opt.description}
      </div>
    )}
  </div>
))}
```

- [ ] **Step 3: Verify client view**

Login as client (dusan@fittrack.rs), open the nutrition page. Meal options with linked ingredients should show ingredient breakdown with per-item macros. Options without ingredients fall back to the text description.

- [ ] **Step 4: Commit**

```bash
git add src/app/\(dashboard\)/client/nutrition/page.tsx src/lib/queries/schedule.ts
git commit -m "feat: show ingredient breakdown with macros in client nutrition view"
```

---

### Task 8: Update week calendar to show ingredient details

**Files:**
- Modify: `src/components/client/week-calendar.tsx`
- Modify: `src/lib/queries/schedule.ts` (the week schedule meal mapping)

- [ ] **Step 1: Pass items through in getWeekSchedule meal mapping**

In `src/lib/queries/schedule.ts`, in the `getWeekSchedule` function, update the meal options mapping (around line 170) to include items:

```typescript
options: m.options.map((o) => ({
  optionNumber: o.optionNumber,
  description: o.description,
  items: (o as any).items?.map((item: any) => ({
    id: item.id,
    quantity: item.quantity,
    foodItem: {
      name: item.foodItem.name,
      protein: item.foodItem.protein,
      carbs: item.foodItem.carbs,
      fat: item.foodItem.fat,
      calories: item.foodItem.calories,
      measuredRaw: item.foodItem.measuredRaw,
    },
  })) ?? [],
})),
```

- [ ] **Step 2: Update WeekDay interface in week-calendar.tsx**

Update the meal options type in the `WeekDay` interface:

```typescript
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
```

- [ ] **Step 3: Update meal option rendering in DayCard expanded view**

In the expanded meal details section of `DayCard` (around line 186-198), replace the meal option rendering:

```tsx
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
                C:{Math.round(item.foodItem.carbs * factor)}
                F:{Math.round(item.foodItem.fat * factor)}
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
```

- [ ] **Step 4: Verify week calendar**

Login as client, open the schedule page. Expand a day — meal options should show ingredient breakdown with macros if available.

- [ ] **Step 5: Commit**

```bash
git add src/components/client/week-calendar.tsx src/lib/queries/schedule.ts
git commit -m "feat: show ingredient macros in weekly schedule view"
```

---

## Verification Checklist

After all tasks are complete:

1. Run `pnpm prisma db seed` — creates food items and links to meal options
2. Open http://localhost:3000/namirnice as trainer — full CRUD works
3. Open http://localhost:3000/namirnice as client — same CRUD works
4. Trainer nutrition editor uses ingredient picker, macros calculate correctly
5. Client nutrition page shows ingredient breakdown
6. Week calendar shows ingredient details in expanded view
7. Deleting a food item in use shows error message
8. Search works on the food items page
9. Run `pnpm build` — no TypeScript errors
