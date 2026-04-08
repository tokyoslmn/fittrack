# FitTrack Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Set up the project scaffold with auth, database, seed data, and layout shell so that a user can register, log in, and see a role-appropriate dashboard skeleton.

**Architecture:** Next.js 15 App Router with Prisma ORM on PostgreSQL. Auth.js v5 with JWT strategy and CredentialsProvider. Middleware enforces role-based routing. Server Components by default with Client Components for forms.

**Tech Stack:** Next.js 15, TypeScript, Tailwind CSS, shadcn/ui, Prisma, Auth.js v5, bcrypt, zod, react-hook-form, pnpm

---

## File Structure

```
fit-track/
├── prisma/
│   ├── schema.prisma              # All 16 models from spec
│   └── seed.ts                    # Complete seed data
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout: fonts, session provider
│   │   ├── page.tsx               # Root redirect by role
│   │   ├── globals.css            # Tailwind + dark theme
│   │   ├── (auth)/
│   │   │   ├── layout.tsx         # Centered auth layout
│   │   │   ├── login/page.tsx     # Login form
│   │   │   └── register/page.tsx  # Register form
│   │   └── (dashboard)/
│   │       ├── layout.tsx         # Sidebar + header
│   │       ├── trainer/page.tsx   # Placeholder trainer home
│   │       └── client/page.tsx    # Placeholder client home
│   ├── components/
│   │   ├── ui/                    # shadcn/ui (button, input, card, label, form)
│   │   ├── auth/
│   │   │   ├── login-form.tsx     # Client Component login form
│   │   │   └── register-form.tsx  # Client Component register form
│   │   └── layout/
│   │       ├── sidebar.tsx        # Role-aware sidebar navigation
│   │       └── header.tsx         # Top header with user info
│   ├── lib/
│   │   ├── prisma.ts              # Singleton Prisma client
│   │   ├── auth.ts                # Auth.js config
│   │   ├── auth-utils.ts          # getServerSession helper, requireAuth
│   │   └── utils.ts               # cn() helper
│   ├── middleware.ts               # Route protection + role redirect
│   └── types/
│       └── next-auth.d.ts         # Extend Session/JWT types with role
├── .env.local
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── postcss.config.mjs
```

---

### Task 1: Project Scaffold

**Files:**
- Create: `package.json`, `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`, `src/lib/utils.ts`

- [ ] **Step 1: Create Next.js project**

```bash
cd /Users/dusan/claude-projects/other/fit-track
pnpm create next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --turbopack --use-pnpm --skip-install
```

If prompted about overwriting existing files, accept. This creates the base scaffold.

- [ ] **Step 2: Install dependencies**

```bash
pnpm install
pnpm add prisma @prisma/client next-auth@beta @auth/prisma-adapter bcryptjs zod react-hook-form @hookform/resolvers
pnpm add -D @types/bcryptjs tsx
```

- [ ] **Step 3: Install shadcn/ui**

```bash
pnpm dlx shadcn@latest init -d
```

Then add the components we need:

```bash
pnpm dlx shadcn@latest add button input label card form separator
```

- [ ] **Step 4: Configure globals.css with dark theme**

Replace `src/app/globals.css` with:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: #0a0a0f;
  --color-foreground: #e8e8ed;
  --font-sans: "DM Sans", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "Space Mono", ui-monospace, monospace;

  --color-sidebar-ring: var(--color-sidebar-border);
  --color-sidebar-border: rgba(255, 255, 255, 0.08);
  --color-sidebar-accent-foreground: var(--color-sidebar-foreground);
  --color-sidebar-accent: rgba(255, 255, 255, 0.05);
  --color-sidebar-foreground: #a0a0a8;
  --color-sidebar-background: #0a0a0f;
  --color-sidebar-primary-foreground: #e8e8ed;
  --color-sidebar-primary: #6366f1;
  --color-chart-5: #ef4444;
  --color-chart-4: #f59e0b;
  --color-chart-3: #22c55e;
  --color-chart-2: #8b5cf6;
  --color-chart-1: #6366f1;
  --radius: 0.75rem;
  --color-destructive: #ef4444;
  --color-accent-foreground: #e8e8ed;
  --color-accent: rgba(255, 255, 255, 0.05);
  --color-muted-foreground: #8b8b95;
  --color-muted: rgba(255, 255, 255, 0.05);
  --color-secondary-foreground: #e8e8ed;
  --color-secondary: #8b5cf6;
  --color-primary-foreground: #ffffff;
  --color-primary: #6366f1;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-input: rgba(255, 255, 255, 0.12);
  --color-ring: #6366f1;
  --color-card-foreground: #e8e8ed;
  --color-card: rgba(255, 255, 255, 0.03);
  --color-popover-foreground: #e8e8ed;
  --color-popover: #0f0f14;

  --color-success: #22c55e;
  --color-warning: #f59e0b;
  --color-danger: #ef4444;
}

@layer base {
  html {
    color-scheme: dark;
  }

  body {
    @apply bg-background text-foreground;
  }
}
```

- [ ] **Step 5: Configure next.config.ts**

Replace `next.config.ts`:

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["bcryptjs"],
};

export default nextConfig;
```

- [ ] **Step 6: Create utils.ts**

Create `src/lib/utils.ts` (shadcn may have already created this — verify and ensure it has):

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 7: Update root layout with fonts**

Replace `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "FitTrack",
  description: "Personalizovano praćenje treninga i ishrane",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" className="dark">
      <body className={`${dmSans.variable} ${spaceMono.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Verify dev server starts**

```bash
pnpm dev
```

Expected: Server starts on http://localhost:3000 with no errors. Visit the URL and see the default Next.js page with dark background.

- [ ] **Step 9: Commit**

```bash
git add -A
git commit -m "feat: project scaffold with Next.js 15, Tailwind, shadcn/ui, dark theme"
```

---

### Task 2: Prisma Schema & Database

**Files:**
- Create: `prisma/schema.prisma`, `.env.local`

- [ ] **Step 1: Initialize Prisma**

```bash
pnpm prisma init
```

- [ ] **Step 2: Create .env.local**

```
DATABASE_URL="postgresql://fittrack:fittrack@localhost:5432/fittrack"
NEXTAUTH_SECRET="dev-secret-change-in-production"
NEXTAUTH_URL="http://localhost:3000"
```

Also update the `.env` that Prisma created to have the same DATABASE_URL (Prisma reads `.env`, not `.env.local`):

```
DATABASE_URL="postgresql://fittrack:fittrack@localhost:5432/fittrack"
```

- [ ] **Step 3: Ensure PostgreSQL is running**

If not already running, start PostgreSQL and create the database:

```bash
createdb fittrack 2>/dev/null || true
```

Or if using Docker for just the DB:

```bash
docker run -d --name fittrack-db -e POSTGRES_USER=fittrack -e POSTGRES_PASSWORD=fittrack -e POSTGRES_DB=fittrack -p 5432:5432 postgres:16-alpine
```

- [ ] **Step 4: Write the Prisma schema**

Replace `prisma/schema.prisma` with the complete schema from the spec:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Role {
  TRAINER
  CLIENT
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  name          String
  role          Role
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  clients       TrainerClient[] @relation("TrainerRelation")
  createdPlans  NutritionPlan[]
  createdWorkoutPlans WorkoutPlan[]

  trainers          TrainerClient[] @relation("ClientRelation")
  weightLogs        WeightLog[]
  bodyCompLogs      BodyCompositionLog[]
  labResults        LabResult[]
  dailyLogs         DailyLog[]
  workoutLogs       WorkoutLog[]
  mealLogs          MealLog[]
  waterLogs         WaterLog[]
  supplementLogs    SupplementLog[]
}

model TrainerClient {
  id         String   @id @default(cuid())
  trainerId  String
  clientId   String
  active     Boolean  @default(true)
  startDate  DateTime @default(now())

  trainer    User     @relation("TrainerRelation", fields: [trainerId], references: [id])
  client     User     @relation("ClientRelation", fields: [clientId], references: [id])

  @@unique([trainerId, clientId])
}

model NutritionPlan {
  id              String   @id @default(cuid())
  trainerId       String
  clientId        String
  name            String
  active          Boolean  @default(true)
  totalProtein    Int
  totalCarbsTrain Int
  totalCarbsRest  Int
  totalFatTrain   Int
  totalFatRest    Int
  totalKcalMin    Int
  totalKcalMax    Int
  rules           String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  trainer     User     @relation(fields: [trainerId], references: [id])
  meals       Meal[]
  supplements SupplementPlan[]
}

model Meal {
  id              String   @id @default(cuid())
  planId          String
  name            String
  time            String
  orderIndex      Int
  isTrainingDay   Boolean
  protein         Int
  carbs           Int
  fat             Int
  icon            String?

  plan            NutritionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  options         MealOption[]
}

model MealOption {
  id           String   @id @default(cuid())
  mealId       String
  optionNumber Int
  description  String

  meal         Meal     @relation(fields: [mealId], references: [id], onDelete: Cascade)
}

model SupplementPlan {
  id          String   @id @default(cuid())
  planId      String
  name        String
  dose        String
  timing      String
  icon        String?

  plan        NutritionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
}

model WorkoutPlan {
  id          String   @id @default(cuid())
  trainerId   String
  clientId    String
  name        String
  active      Boolean  @default(true)
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  trainer     User     @relation(fields: [trainerId], references: [id])
  schedule    WeeklySchedule[]
  workouts    Workout[]
}

model WeeklySchedule {
  id          String   @id @default(cuid())
  planId      String
  dayOfWeek   Int
  dayName     String
  type        String
  workoutId   String?
  label       String
  restNotes   String?

  plan        WorkoutPlan  @relation(fields: [planId], references: [id], onDelete: Cascade)
  workout     Workout?     @relation(fields: [workoutId], references: [id])
}

model Workout {
  id          String   @id @default(cuid())
  planId      String
  name        String
  focus       String
  orderIndex  Int

  plan            WorkoutPlan     @relation(fields: [planId], references: [id], onDelete: Cascade)
  warmups         WarmupExercise[]
  exercises       Exercise[]
  scheduleDays    WeeklySchedule[]
}

model WarmupExercise {
  id          String   @id @default(cuid())
  workoutId   String
  name        String
  videoUrl    String?
  orderIndex  Int

  workout     Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
}

model Exercise {
  id          String   @id @default(cuid())
  workoutId   String
  exerciseId  String
  name        String
  sets        String
  note        String?
  videoUrl    String?
  orderIndex  Int

  workout     Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
}

model WeightLog {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime
  weight    Float
  note      String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}

model BodyCompositionLog {
  id              String   @id @default(cuid())
  userId          String
  date            DateTime
  weight          Float?
  bodyFatPct      Float?
  fatMass         Float?
  muscleMass      Float?
  musclePct       Float?
  skeletalMuscle  Float?
  bodyWater       Float?
  visceralFat     Float?
  bmr             Int?
  bmi             Float?
  waistHip        Float?
  heartRate       Int?
  note            String?
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id])
}

model LabResult {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime
  labName     String?
  protocolNum String?
  filePath    String?
  notes       String?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  items       LabResultItem[]
}

model LabResultItem {
  id          String   @id @default(cuid())
  resultId    String
  category    String
  name        String
  value       Float
  unit        String
  refRange    String
  status      String

  result      LabResult @relation(fields: [resultId], references: [id], onDelete: Cascade)
}

model DailyLog {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime
  waterMl     Int      @default(0)
  steps       Int?
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user        User     @relation(fields: [userId], references: [id])

  @@unique([userId, date])
}

model WorkoutLog {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime
  workoutId   String?
  completed   Boolean  @default(false)
  duration    Int?
  notes       String?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  exerciseLogs ExerciseLog[]
}

model ExerciseLog {
  id            String   @id @default(cuid())
  workoutLogId  String
  exerciseId    String
  completed     Boolean  @default(false)
  weight        Float?
  reps          String?
  notes         String?

  workoutLog    WorkoutLog @relation(fields: [workoutLogId], references: [id], onDelete: Cascade)
}

model MealLog {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime
  mealName    String
  time        String?
  description String
  photoPath   String?
  onPlan      Boolean  @default(true)
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}

model WaterLog {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime
  amountMl    Int
  time        String?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}

model SupplementLog {
  id              String   @id @default(cuid())
  userId          String
  date            DateTime
  supplementName  String
  taken           Boolean  @default(false)
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id])
}
```

- [ ] **Step 5: Run migration**

```bash
pnpm prisma migrate dev --name init
```

Expected: Migration creates all tables. Output includes "Your database is now in sync with your schema."

- [ ] **Step 6: Create Prisma singleton**

Create `src/lib/prisma.ts`:

```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

- [ ] **Step 7: Commit**

```bash
git add prisma/ src/lib/prisma.ts .env.local .env
git commit -m "feat: Prisma schema with 16 models and PostgreSQL connection"
```

---

### Task 3: Auth.js Configuration

**Files:**
- Create: `src/lib/auth.ts`, `src/lib/auth-utils.ts`, `src/types/next-auth.d.ts`, `src/app/api/auth/[...nextauth]/route.ts`, `src/middleware.ts`

- [ ] **Step 1: Create next-auth type extensions**

Create `src/types/next-auth.d.ts`:

```typescript
import { Role } from "@prisma/client";
import "next-auth";

declare module "next-auth" {
  interface User {
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: Role;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
  }
}
```

- [ ] **Step 2: Create Auth.js config**

Create `src/lib/auth.ts`:

```typescript
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials) {
        const email = credentials.email as string;
        const password = credentials.password as string;

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user) return null;

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id!;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
});
```

- [ ] **Step 3: Create auth utilities**

Create `src/lib/auth-utils.ts`:

```typescript
import { redirect } from "next/navigation";
import { auth } from "./auth";
import { Role } from "@prisma/client";

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }
  return session;
}

export async function requireRole(role: Role) {
  const session = await requireAuth();
  if (session.user.role !== role) {
    redirect(session.user.role === "TRAINER" ? "/trainer" : "/client");
  }
  return session;
}
```

- [ ] **Step 4: Create route handler**

Create `src/app/api/auth/[...nextauth]/route.ts`:

```typescript
import { handlers } from "@/lib/auth";

export const { GET, POST } = handlers;
```

- [ ] **Step 5: Create middleware**

Create `src/middleware.ts`:

```typescript
import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const role = req.auth?.user?.role;

  const isAuthRoute = nextUrl.pathname.startsWith("/login") || nextUrl.pathname.startsWith("/register");
  const isTrainerRoute = nextUrl.pathname.startsWith("/trainer");
  const isClientRoute = nextUrl.pathname.startsWith("/client");
  const isApiRoute = nextUrl.pathname.startsWith("/api");

  // Allow API routes through
  if (isApiRoute) return NextResponse.next();

  // Redirect logged-in users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    const dest = role === "TRAINER" ? "/trainer" : "/client";
    return NextResponse.redirect(new URL(dest, nextUrl));
  }

  // Require auth for dashboard routes
  if ((isTrainerRoute || isClientRoute) && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", nextUrl));
  }

  // Role enforcement
  if (isTrainerRoute && role !== "TRAINER") {
    return NextResponse.redirect(new URL("/client", nextUrl));
  }
  if (isClientRoute && role !== "CLIENT") {
    return NextResponse.redirect(new URL("/trainer", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
```

- [ ] **Step 6: Create register API route**

Create `src/app/api/auth/register/route.ts`:

```typescript
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["TRAINER", "CLIENT"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password, role } = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email je već registrovan" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: { name, email, password: hashedPassword, role },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
```

- [ ] **Step 7: Verify auth config compiles**

```bash
pnpm build
```

Expected: Build succeeds with no type errors.

- [ ] **Step 8: Commit**

```bash
git add src/lib/auth.ts src/lib/auth-utils.ts src/types/next-auth.d.ts src/app/api/auth/ src/middleware.ts
git commit -m "feat: Auth.js v5 with credentials provider, middleware, and register API"
```

---

### Task 4: Auth Pages (Login & Register)

**Files:**
- Create: `src/app/(auth)/layout.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/register/page.tsx`, `src/components/auth/login-form.tsx`, `src/components/auth/register-form.tsx`

- [ ] **Step 1: Create auth layout**

Create `src/app/(auth)/layout.tsx`:

```tsx
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">{children}</div>
    </div>
  );
}
```

- [ ] **Step 2: Create login form component**

Create `src/components/auth/login-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = await signIn("credentials", {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Pogrešan email ili lozinka");
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">FitTrack</CardTitle>
        <p className="text-muted-foreground">Prijavi se na svoj nalog</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="email@primer.rs"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lozinka</Label>
            <Input
              id="password"
              name="password"
              type="password"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Prijavljivanje..." : "Prijavi se"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Nemaš nalog?{" "}
          <Link href="/register" className="text-primary hover:underline">
            Registruj se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 3: Create login page**

Create `src/app/(auth)/login/page.tsx`:

```tsx
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <LoginForm />;
}
```

- [ ] **Step 4: Create register form component**

Create `src/components/auth/register-form.tsx`:

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: formData.get("role"),
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Greška pri registraciji");
      return;
    }

    router.push("/login");
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">FitTrack</CardTitle>
        <p className="text-muted-foreground">Kreiraj novi nalog</p>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Ime i prezime</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Lozinka</Label>
            <Input id="password" name="password" type="password" minLength={6} required />
          </div>
          <div className="space-y-2">
            <Label>Uloga</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2">
                <input type="radio" name="role" value="CLIENT" defaultChecked className="accent-primary" />
                <span>Klijent</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="role" value="TRAINER" className="accent-primary" />
                <span>Trener</span>
              </label>
            </div>
          </div>
          {error && (
            <p className="text-sm text-danger">{error}</p>
          )}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Registracija..." : "Registruj se"}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Već imaš nalog?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Prijavi se
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 5: Create register page**

Create `src/app/(auth)/register/page.tsx`:

```tsx
import { RegisterForm } from "@/components/auth/register-form";

export default function RegisterPage() {
  return <RegisterForm />;
}
```

- [ ] **Step 6: Update root page to redirect by role**

Replace `src/app/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if (session.user.role === "TRAINER") {
    redirect("/trainer");
  }

  redirect("/client");
}
```

- [ ] **Step 7: Add SessionProvider to root layout**

Update `src/app/layout.tsx` to wrap children with SessionProvider:

```tsx
import type { Metadata } from "next";
import { DM_Sans, Space_Mono } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "FitTrack",
  description: "Personalizovano praćenje treninga i ishrane",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sr" className="dark">
      <body className={`${dmSans.variable} ${spaceMono.variable} font-sans antialiased`}>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 8: Verify login page renders**

```bash
pnpm dev
```

Visit http://localhost:3000/login — should see the dark-themed login card with email/password fields.

- [ ] **Step 9: Commit**

```bash
git add src/app/\(auth\)/ src/components/auth/ src/app/page.tsx src/app/layout.tsx
git commit -m "feat: login and register pages with auth forms"
```

---

### Task 5: Seed Script

**Files:**
- Create: `prisma/seed.ts`
- Modify: `package.json` (add prisma seed config)

- [ ] **Step 1: Create the seed script**

Create `prisma/seed.ts`:

```typescript
import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Clean existing data
  await prisma.supplementLog.deleteMany();
  await prisma.waterLog.deleteMany();
  await prisma.mealLog.deleteMany();
  await prisma.exerciseLog.deleteMany();
  await prisma.workoutLog.deleteMany();
  await prisma.dailyLog.deleteMany();
  await prisma.labResultItem.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.bodyCompositionLog.deleteMany();
  await prisma.weightLog.deleteMany();
  await prisma.weeklySchedule.deleteMany();
  await prisma.warmupExercise.deleteMany();
  await prisma.exercise.deleteMany();
  await prisma.workout.deleteMany();
  await prisma.workoutPlan.deleteMany();
  await prisma.mealOption.deleteMany();
  await prisma.meal.deleteMany();
  await prisma.supplementPlan.deleteMany();
  await prisma.nutritionPlan.deleteMany();
  await prisma.trainerClient.deleteMany();
  await prisma.user.deleteMany();

  const hashedPassword = await bcrypt.hash("fittrack123", 10);

  // Users
  const trainer = await prisma.user.create({
    data: {
      email: "jovana@fittrack.rs",
      password: hashedPassword,
      name: "Jovana Đaković",
      role: Role.TRAINER,
    },
  });

  const client = await prisma.user.create({
    data: {
      email: "dusan@fittrack.rs",
      password: hashedPassword,
      name: "Dušan Stanković",
      role: Role.CLIENT,
    },
  });

  await prisma.trainerClient.create({
    data: { trainerId: trainer.id, clientId: client.id },
  });

  // ─── NUTRITION PLAN ──────────────────────────────────────────
  const nutritionPlan = await prisma.nutritionPlan.create({
    data: {
      trainerId: trainer.id,
      clientId: client.id,
      name: "Smanjenje masti / Rekompozicija — Faza 1",
      totalProtein: 170,
      totalCarbsTrain: 150,
      totalCarbsRest: 135,
      totalFatTrain: 70,
      totalFatRest: 85,
      totalKcalMin: 1910,
      totalKcalMax: 1985,
      rules: JSON.stringify([
        "Meriti sve precizno (kuhinjska vaga)",
        "Kuvano se meri posle pripreme, sirovo se meri sirovo",
        "Maslinovo ulje za salate, kokosovo ulje ili puter za grilovanje",
        "Bez suncokretovog ulja",
        "Kafa OK bez šećera (1-2 dnevno)",
        "3-4L vode dnevno, pola litra ujutru odmah po buđenju",
        "Svi začini dozvoljeni",
        "Salate ne moraju da se vagaju",
      ]),
    },
  });

  // Training day meals
  const trainingMeals = [
    {
      name: "Intra workout",
      time: "08:30",
      orderIndex: 0,
      isTrainingDay: true,
      protein: 15, carbs: 0, fat: 0,
      icon: "🥤",
      options: [
        { optionNumber: 1, description: "15g EAA + 5g kreatin u vodi" },
      ],
    },
    {
      name: "Post workout (Obrok 1)",
      time: "08:50",
      orderIndex: 1,
      isTrainingDay: true,
      protein: 25, carbs: 40, fat: 0,
      icon: "🍽️",
      options: [
        { optionNumber: 1, description: "30g whey protein + 200g banana" },
      ],
    },
    {
      name: "Ručak (Obrok 2)",
      time: "12:00",
      orderIndex: 2,
      isTrainingDay: true,
      protein: 60, carbs: 45, fat: 25,
      icon: "🍽️",
      options: [
        { optionNumber: 1, description: "250g bela piletina na žaru + 250g krompir + salata + 20ml maslinovo ulje" },
        { optionNumber: 2, description: "200g crveno meso + 250g krompir ili 150g pirinac + salata + 20ml maslinovo ulje" },
      ],
    },
    {
      name: "Užina (Obrok 3)",
      time: "15:00",
      orderIndex: 3,
      isTrainingDay: true,
      protein: 40, carbs: 27, fat: 25,
      icon: "🍽️",
      options: [
        { optionNumber: 1, description: "100g tunjevina + 60g integralni hleb + 50g mladi sir + salata + 10ml maslinovo ulje" },
        { optionNumber: 2, description: "150-200g mesa od ručka + hleb + salata" },
        { optionNumber: 3, description: "2× proteinski jogurt/skyr + 100g borovnica + 40g badem" },
      ],
    },
    {
      name: "Večera (Obrok 4)",
      time: "21:00",
      orderIndex: 4,
      isTrainingDay: true,
      protein: 42, carbs: 35, fat: 20,
      icon: "🍽️",
      options: [
        { optionNumber: 1, description: "200g piletina + 150g krompir + 100g zeleno povrće + 15ml maslinovo ulje" },
        { optionNumber: 2, description: "100g tunjevina + 2 jaja + 80g pirinac + povrće" },
        { optionNumber: 3, description: "150g biftek + 200g krompir + salata" },
      ],
    },
  ];

  // Rest day meals
  const restMeals = [
    {
      name: "Doručak",
      time: "09:00",
      orderIndex: 0,
      isTrainingDay: false,
      protein: 20, carbs: 25, fat: 15,
      icon: "🍽️",
      options: [
        { optionNumber: 1, description: "Tost + jaja + maslinovo ulje + salata" },
        { optionNumber: 2, description: "Jogurt + borovnica + badem" },
        { optionNumber: 3, description: "Grčki jogurt + whey + kikiriki puter + borovnica" },
      ],
    },
    {
      name: "Ručak (Obrok 2)",
      time: "12:00",
      orderIndex: 1,
      isTrainingDay: false,
      protein: 60, carbs: 45, fat: 25,
      icon: "🍽️",
      options: [
        { optionNumber: 1, description: "250g bela piletina na žaru + 250g krompir + salata + 20ml maslinovo ulje" },
        { optionNumber: 2, description: "200g crveno meso + 250g krompir ili 150g pirinac + salata + 20ml maslinovo ulje" },
      ],
    },
    {
      name: "Užina (Obrok 3)",
      time: "15:00",
      orderIndex: 2,
      isTrainingDay: false,
      protein: 40, carbs: 27, fat: 25,
      icon: "🍽️",
      options: [
        { optionNumber: 1, description: "100g tunjevina + 60g integralni hleb + 50g mladi sir + salata + 10ml maslinovo ulje" },
        { optionNumber: 2, description: "150-200g mesa od ručka + hleb + salata" },
        { optionNumber: 3, description: "2× proteinski jogurt/skyr + 100g borovnica + 40g badem" },
      ],
    },
    {
      name: "Večera (Obrok 4)",
      time: "21:00",
      orderIndex: 3,
      isTrainingDay: false,
      protein: 42, carbs: 35, fat: 20,
      icon: "🍽️",
      options: [
        { optionNumber: 1, description: "200g piletina + 150g krompir + 100g zeleno povrće + 15ml maslinovo ulje" },
        { optionNumber: 2, description: "100g tunjevina + 2 jaja + 80g pirinac + povrće" },
        { optionNumber: 3, description: "150g biftek + 200g krompir + salata" },
      ],
    },
  ];

  for (const meal of [...trainingMeals, ...restMeals]) {
    const { options, ...mealData } = meal;
    await prisma.meal.create({
      data: {
        planId: nutritionPlan.id,
        ...mealData,
        options: {
          create: options,
        },
      },
    });
  }

  // Supplements
  const supplements = [
    { name: "Whey protein", dose: "Po planu obroka", timing: "Uz obroke", icon: "🥛" },
    { name: "EAA/BCAA", dose: "15g", timing: "Intra workout", icon: "💪" },
    { name: "Omega 3 (Puori)", dose: "3 kapsule (2000mg EPA/DHA)", timing: "Uz obroke", icon: "🐟" },
    { name: "Vitamin D (Vigantol)", dose: "5000 IU", timing: "Dnevno, prvi mesec", icon: "☀️" },
    { name: "Magnezijum bisglicinat", dose: "300mg", timing: "Uveče", icon: "🌙" },
    { name: "Kreatin", dose: "5g", timing: "Kasnije uvesti", icon: "⚡" },
  ];

  for (const sup of supplements) {
    await prisma.supplementPlan.create({
      data: { planId: nutritionPlan.id, ...sup },
    });
  }

  // ─── WORKOUT PLAN ─────────────────────────────────────────────
  const workoutPlan = await prisma.workoutPlan.create({
    data: {
      trainerId: trainer.id,
      clientId: client.id,
      name: "Recompozicija — Faza 1",
    },
  });

  const warmups = [
    { name: "Cat-Cow 2×15", videoUrl: "https://youtube.com/shorts/2of247Kt0tU", orderIndex: 0 },
    { name: "Plivanje sa poda 2×12", videoUrl: "https://youtube.com/shorts/8RJLYUH0akM", orderIndex: 1 },
    { name: "Kukovi 90-90 2×12", videoUrl: "https://youtube.com/shorts/PuxmfP2Rr74", orderIndex: 2 },
    { name: "Pigeon stretch 2×20s", videoUrl: "https://youtube.com/shorts/8RJLYUH0akM", orderIndex: 3 },
    { name: "Dead bug 2×12", videoUrl: "https://youtube.com/shorts/DqLL45uk2Tk", orderIndex: 4 },
    { name: "Hip thrust 2×12-15", videoUrl: "https://youtube.com/shorts/Ka0KbvsOKOs", orderIndex: 5 },
    { name: "Side plank 2×12", videoUrl: "https://youtube.com/shorts/OxUqMcC944g", orderIndex: 6 },
  ];

  // Workout A
  const workoutA = await prisma.workout.create({
    data: {
      planId: workoutPlan.id,
      name: "Trening A",
      focus: "Čučanj / Vučenje / Ramena",
      orderIndex: 0,
      warmups: { create: warmups },
      exercises: {
        create: [
          { exerciseId: "A1", name: "Goblet čučanj", sets: "2×12", note: "5s na dole, jak core brace", videoUrl: "https://youtube.com/shorts/cuUPtfanAFQ", orderIndex: 0 },
          { exerciseId: "D1", name: "Horizontalno vučenje kablovi", sets: "2×12", note: "3s negativna faza", videoUrl: "https://youtube.com/shorts/LyZH4UGdDTc", orderIndex: 1 },
          { exerciseId: "E1", name: "Lat pull down široki", sets: "2×12", note: "3s negativna faza", videoUrl: "https://youtube.com/shorts/bNmvKpJSWKM", orderIndex: 2 },
          { exerciseId: "F1", name: "Shoulder press", sets: "2×12", videoUrl: "https://youtube.com/shorts/k6tzKisR3NY", orderIndex: 3 },
          { exerciseId: "G1", name: "Biceps pregib", sets: "2×12", orderIndex: 4 },
          { exerciseId: "H1", name: "Triceps ekstenzija", sets: "2×12", orderIndex: 5 },
        ],
      },
    },
  });

  // Workout B
  const workoutB = await prisma.workout.create({
    data: {
      planId: workoutPlan.id,
      name: "Trening B",
      focus: "Iskoraci / Grudi / Leđa",
      orderIndex: 1,
      warmups: { create: warmups },
      exercises: {
        create: [
          { exerciseId: "A1", name: "Prednji čučanj", sets: "2×6", note: "20s izdržaj na dnu, lagana kilaža", orderIndex: 0 },
          { exerciseId: "B1", name: "Hodajući iskorak bučice", sets: "2×12", videoUrl: "https://youtube.com/shorts/f7Aw2yiqmVs", orderIndex: 1 },
          { exerciseId: "C1", name: "RDL sa bučicama", sets: "2×12", videoUrl: "https://youtube.com/shorts/g646-pldmcc", orderIndex: 2 },
          { exerciseId: "D1", name: "Lat pull down uski", sets: "2×12", note: "3s na dole", orderIndex: 3 },
          { exerciseId: "E1", name: "Incline bench press bučice", sets: "2×12", note: "3s na dole", videoUrl: "https://youtube.com/shorts/8fXfwG4ftaQ", orderIndex: 4 },
          { exerciseId: "F1", name: "Pec dec mašina", sets: "2×12", note: "2s zadržaj", videoUrl: "https://youtube.com/shorts/a9vQ_hwIksU", orderIndex: 5 },
        ],
      },
    },
  });

  // Workout C
  const workoutC = await prisma.workout.create({
    data: {
      planId: workoutPlan.id,
      name: "Trening C",
      focus: "Abduktori / Bench / Veslanje",
      orderIndex: 2,
      warmups: { create: warmups },
      exercises: {
        create: [
          { exerciseId: "A1", name: "Abdukcija mašina", sets: "2×15", note: "3s negativna faza, može jače", orderIndex: 0 },
          { exerciseId: "B1", name: "Adukcija", sets: "2×15", note: "3s negativna faza", orderIndex: 1 },
          { exerciseId: "C1", name: "Hodajući iskorak", sets: "2×12", orderIndex: 2 },
          { exerciseId: "D1", name: "Bench press šipka", sets: "2×12", videoUrl: "https://youtube.com/shorts/_FkbD0FhgVE", orderIndex: 3 },
          { exerciseId: "E1", name: "Unilateralno veslanje bučice", sets: "2×12", videoUrl: "https://youtube.com/shorts/yHqqGd0tXcw", orderIndex: 4 },
          { exerciseId: "F1", name: "Letenje", sets: "2×12", note: "3s na dole", videoUrl: "https://youtube.com/shorts/rk8YayRoTRQ", orderIndex: 5 },
          { exerciseId: "G1", name: "Face pull", sets: "2×12", videoUrl: "https://youtube.com/shorts/IeOqdw9WI90", orderIndex: 6 },
        ],
      },
    },
  });

  // Weekly Schedule
  const schedule = [
    { dayOfWeek: 0, dayName: "Ponedeljak", type: "training", workoutId: workoutA.id, label: "Trening A" },
    { dayOfWeek: 1, dayName: "Utorak", type: "rest", workoutId: null, label: "Odmor / Šetnja", restNotes: "Min 5000-7000 koraka" },
    { dayOfWeek: 2, dayName: "Sreda", type: "training", workoutId: workoutB.id, label: "Trening B" },
    { dayOfWeek: 3, dayName: "Četvrtak", type: "rest", workoutId: null, label: "Odmor / Šetnja", restNotes: "Min 5000-7000 koraka" },
    { dayOfWeek: 4, dayName: "Petak", type: "training", workoutId: workoutC.id, label: "Trening C" },
    { dayOfWeek: 5, dayName: "Subota", type: "rest", workoutId: null, label: "Odmor / Šetnja", restNotes: "Min 5000-7000 koraka" },
    { dayOfWeek: 6, dayName: "Nedelja", type: "rest", workoutId: null, label: "Odmor / Šetnja", restNotes: "Min 5000-7000 koraka" },
  ];

  for (const day of schedule) {
    await prisma.weeklySchedule.create({
      data: { planId: workoutPlan.id, ...day },
    });
  }

  // ─── INITIAL BODY COMPOSITION ─────────────────────────────────
  await prisma.bodyCompositionLog.create({
    data: {
      userId: client.id,
      date: new Date("2026-03-25"),
      weight: 105.6,
      bodyFatPct: 30.5,
      fatMass: 32.2,
      muscleMass: 69.3,
      musclePct: 65.6,
      skeletalMuscle: 41.5,
      bodyWater: 53.2,
      visceralFat: 14,
      bmr: 1955,
      bmi: 32.2,
      waistHip: 0.9,
      heartRate: 83,
      note: "Inicijalno merenje",
    },
  });

  await prisma.weightLog.create({
    data: {
      userId: client.id,
      date: new Date("2026-03-25"),
      weight: 105.6,
      note: "Inicijalno merenje",
    },
  });

  // ─── LAB RESULTS ──────────────────────────────────────────────
  const labResult = await prisma.labResult.create({
    data: {
      userId: client.id,
      date: new Date("2026-03-28"),
      labName: "Euromedik",
      protocolNum: "14468878/14468939",
      notes: "Inicijalne analize",
    },
  });

  const labItems = [
    // Krvna slika
    { category: "Krvna slika", name: "Leukociti", value: 5.9, unit: "×10⁹/L", refRange: "3.5-10.0", status: "ok" },
    { category: "Krvna slika", name: "Eritrociti", value: 4.93, unit: "×10¹²/L", refRange: "3.80-6.30", status: "ok" },
    { category: "Krvna slika", name: "Hemoglobin", value: 151, unit: "g/L", refRange: "120-180", status: "ok" },
    { category: "Krvna slika", name: "Trombociti", value: 239, unit: "×10⁹/L", refRange: "140-440", status: "ok" },
    // Dijabetes
    { category: "Dijabetes", name: "Glukoza", value: 5.6, unit: "mmol/L", refRange: "3.9-5.9", status: "warn" },
    { category: "Dijabetes", name: "HbA1c", value: 5.3, unit: "%", refRange: "4.0-5.9", status: "ok" },
    { category: "Dijabetes", name: "Insulin", value: 15.5, unit: "mIU/L", refRange: "2.6-24.9", status: "ok" },
    { category: "Dijabetes", name: "HOMA-IR", value: 3.86, unit: "", refRange: "<2.5", status: "high" },
    // Lipidi
    { category: "Lipidni status", name: "HDL", value: 1.24, unit: "mmol/L", refRange: ">1.00", status: "ok" },
    { category: "Lipidni status", name: "LDL", value: 4.17, unit: "mmol/L", refRange: "<4.10", status: "high" },
    { category: "Lipidni status", name: "Trigliceridi", value: 1.06, unit: "mmol/L", refRange: "<1.70", status: "ok" },
    { category: "Lipidni status", name: "Index ateroskleroze", value: 3.40, unit: "", refRange: "<3.00", status: "high" },
    { category: "Lipidni status", name: "APO-B", value: 119, unit: "mg/dL", refRange: "66-133", status: "warn" },
    // Biohemija
    { category: "Biohemija", name: "Urea", value: 4.6, unit: "mmol/L", refRange: "2.5-8.3", status: "ok" },
    { category: "Biohemija", name: "Kreatinin", value: 95, unit: "µmol/L", refRange: "62-115", status: "ok" },
    { category: "Biohemija", name: "eGFR", value: 75, unit: "mL/min", refRange: ">60", status: "ok" },
    { category: "Biohemija", name: "AST", value: 28, unit: "U/L", refRange: "0-40", status: "ok" },
    { category: "Biohemija", name: "ALT", value: 39, unit: "U/L", refRange: "0-41", status: "ok" },
    { category: "Biohemija", name: "Gama GT", value: 23, unit: "U/L", refRange: "8-61", status: "ok" },
    // Hormoni
    { category: "Hormoni", name: "TSH", value: 2.66, unit: "mIU/L", refRange: "0.27-4.20", status: "ok" },
    { category: "Hormoni", name: "FT4", value: 13.8, unit: "pmol/L", refRange: "12-22", status: "warn" },
    { category: "Hormoni", name: "T3", value: 1.6, unit: "nmol/L", refRange: "1.2-3.1", status: "warn" },
    { category: "Hormoni", name: "Testosteron", value: 14.00, unit: "nmol/L", refRange: "9.90-27.80", status: "warn" },
    { category: "Hormoni", name: "SHBG", value: 20.2, unit: "nmol/L", refRange: "18.3-76.7", status: "warn" },
    { category: "Hormoni", name: "Kortizol", value: 301, unit: "nmol/L", refRange: "166-507", status: "ok" },
    // Vitamini i minerali
    { category: "Vitamini i minerali", name: "Vitamin D", value: 36.2, unit: "nmol/L", refRange: "75-250", status: "low" },
    { category: "Vitamini i minerali", name: "B12", value: 288, unit: "pmol/L", refRange: "138-652", status: "ok" },
    { category: "Vitamini i minerali", name: "Gvožđe", value: 18.8, unit: "µmol/L", refRange: "11.6-31.3", status: "ok" },
    { category: "Vitamini i minerali", name: "Feritin", value: 140, unit: "µg/L", refRange: "30-400", status: "ok" },
    { category: "Vitamini i minerali", name: "Fosfor", value: 1.20, unit: "mmol/L", refRange: "0.81-1.45", status: "ok" },
  ];

  for (const item of labItems) {
    await prisma.labResultItem.create({
      data: { resultId: labResult.id, ...item },
    });
  }

  console.log("✓ Seed data created successfully");
  console.log(`  Trainer: ${trainer.email} (password: fittrack123)`);
  console.log(`  Client: ${client.email} (password: fittrack123)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Add seed config to package.json**

Add to `package.json`:

```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 3: Run the seed**

```bash
pnpm prisma db seed
```

Expected output:
```
✓ Seed data created successfully
  Trainer: jovana@fittrack.rs (password: fittrack123)
  Client: dusan@fittrack.rs (password: fittrack123)
```

- [ ] **Step 4: Verify with Prisma Studio**

```bash
pnpm prisma studio
```

Open http://localhost:5555 and verify:
- 2 users (trainer + client)
- 1 nutrition plan with 9 meals (5 training + 4 rest), each with options
- 6 supplements
- 1 workout plan with 3 workouts, each with 7 warmups and exercises
- 7 weekly schedule entries
- 1 body composition log, 1 weight log
- 1 lab result with ~29 items

- [ ] **Step 5: Commit**

```bash
git add prisma/seed.ts package.json
git commit -m "feat: seed script with complete trainer/client test data"
```

---

### Task 6: Dashboard Layout Shell

**Files:**
- Create: `src/app/(dashboard)/layout.tsx`, `src/components/layout/sidebar.tsx`, `src/components/layout/header.tsx`, `src/app/(dashboard)/trainer/page.tsx`, `src/app/(dashboard)/client/page.tsx`

- [ ] **Step 1: Create sidebar component**

Create `src/components/layout/sidebar.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const trainerLinks = [
  { href: "/trainer", label: "Klijenti", icon: "👥" },
];

const clientLinks = [
  { href: "/client", label: "Danas", icon: "📅" },
  { href: "/client/workout", label: "Trening", icon: "🏋️" },
  { href: "/client/nutrition", label: "Ishrana", icon: "🍽️" },
  { href: "/client/log/weight", label: "Težina", icon: "⚖️" },
  { href: "/client/log/water", label: "Voda", icon: "💧" },
  { href: "/client/log/food", label: "Dnevnik", icon: "📝" },
  { href: "/client/log/supplements", label: "Suplementi", icon: "💊" },
  { href: "/client/log/body-comp", label: "Kompozicija", icon: "📊" },
  { href: "/client/lab-results", label: "Laboratorija", icon: "🔬" },
  { href: "/client/progress", label: "Napredak", icon: "📈" },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const links = session?.user?.role === "TRAINER" ? trainerLinks : clientLinks;

  return (
    <aside className="hidden md:flex md:w-56 md:flex-col md:border-r md:border-border bg-background">
      <div className="flex h-14 items-center border-b border-border px-4">
        <Link href="/" className="text-lg font-bold text-primary">
          FitTrack
        </Link>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              pathname === link.href
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-foreground"
            )}
          >
            <span>{link.icon}</span>
            <span>{link.label}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Create header component**

Create `src/components/layout/header.tsx`:

```tsx
"use client";

import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="flex h-14 items-center justify-between border-b border-border px-4 md:px-6">
      <div className="md:hidden text-lg font-bold text-primary">FitTrack</div>
      <div className="flex items-center gap-4 ml-auto">
        <span className="text-sm text-muted-foreground">
          {session?.user?.name}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          Odjavi se
        </Button>
      </div>
    </header>
  );
}
```

- [ ] **Step 3: Create mobile bottom navigation**

Create `src/components/layout/mobile-nav.tsx`:

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

const clientTabs = [
  { href: "/client", label: "Danas", icon: "📅" },
  { href: "/client/workout", label: "Trening", icon: "🏋️" },
  { href: "/client/nutrition", label: "Ishrana", icon: "🍽️" },
  { href: "/client/log/weight", label: "Težina", icon: "⚖️" },
  { href: "/client/progress", label: "Više", icon: "•••" },
];

const trainerTabs = [
  { href: "/trainer", label: "Klijenti", icon: "👥" },
];

export function MobileNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const tabs = session?.user?.role === "TRAINER" ? trainerTabs : clientTabs;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden border-t border-border bg-background">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={cn(
            "flex flex-1 flex-col items-center gap-1 py-2 text-xs transition-colors",
            pathname === tab.href
              ? "text-primary"
              : "text-muted-foreground"
          )}
        >
          <span className="text-lg">{tab.icon}</span>
          <span>{tab.label}</span>
        </Link>
      ))}
    </nav>
  );
}
```

- [ ] **Step 4: Create dashboard layout**

Create `src/app/(dashboard)/layout.tsx`:

```tsx
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
          {children}
        </main>
        <MobileNav />
      </div>
    </div>
  );
}
```

- [ ] **Step 5: Create placeholder client page**

Create `src/app/(dashboard)/client/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";

export default async function ClientPage() {
  const session = await requireRole("CLIENT");

  return (
    <div>
      <h1 className="text-2xl font-bold">Zdravo, {session.user.name}!</h1>
      <p className="text-muted-foreground mt-2">Današnji raspored dolazi uskoro.</p>
    </div>
  );
}
```

- [ ] **Step 6: Create placeholder trainer page**

Create `src/app/(dashboard)/trainer/page.tsx`:

```tsx
import { requireRole } from "@/lib/auth-utils";

export default async function TrainerPage() {
  const session = await requireRole("TRAINER");

  return (
    <div>
      <h1 className="text-2xl font-bold">Zdravo, {session.user.name}!</h1>
      <p className="text-muted-foreground mt-2">Lista klijenata dolazi uskoro.</p>
    </div>
  );
}
```

- [ ] **Step 7: End-to-end verification**

```bash
pnpm dev
```

1. Visit http://localhost:3000 — should redirect to /login
2. Log in as `dusan@fittrack.rs` / `fittrack123` — should redirect to /client with sidebar, header, and placeholder content
3. Click "Odjavi se" — should redirect to /login
4. Log in as `jovana@fittrack.rs` / `fittrack123` — should redirect to /trainer
5. Try visiting /client as trainer — should redirect to /trainer
6. Try visiting /trainer as client — should redirect to /client

- [ ] **Step 8: Commit**

```bash
git add src/app/\(dashboard\)/ src/components/layout/
git commit -m "feat: dashboard layout with sidebar, header, mobile nav, and role-based routing"
```

---

## Verification Checklist

After all tasks are complete, verify end-to-end:

1. `pnpm dev` starts without errors
2. `pnpm build` completes without errors
3. Database has all seed data (check via `pnpm prisma studio`)
4. Login works for both trainer and client accounts
5. Registration creates a new user and redirects to login
6. Role-based routing correctly enforces access
7. Dashboard layout shows sidebar on desktop, bottom nav on mobile
8. Dark theme applies consistently across all pages
