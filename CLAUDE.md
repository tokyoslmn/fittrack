# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FitTrack is a full-stack fitness tracking platform connecting personal trainers with clients. Trainers create nutrition/workout plans; clients execute them and log daily progress. All UI text is in **Serbian (Latin script, no Cyrillic)**.

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, TypeScript)
- **UI:** Tailwind CSS + shadcn/ui
- **Database:** PostgreSQL 16 + Prisma ORM
- **Auth:** Auth.js v5 (email + password; Google OAuth planned for Phase 2)
- **Forms:** zod + react-hook-form
- **File uploads:** Local filesystem (`/uploads`), Next.js API route
- **Package manager:** pnpm
- **Deployment:** Docker Compose (Next.js + PostgreSQL + Nginx)
- **PWA:** next-pwa

## Commands

```bash
pnpm dev                    # Start dev server
pnpm build                  # Production build
pnpm start                  # Start production server
pnpm lint                   # ESLint
pnpm prisma migrate dev     # Run database migrations
pnpm prisma db seed         # Seed initial data
pnpm prisma generate        # Regenerate Prisma client
pnpm prisma studio          # Visual database browser
docker-compose up -d        # Start full stack (app + db + nginx)
```

## Architecture

### Routing (App Router)

```
app/
├── (auth)/login, register        # Public auth pages
├── (dashboard)/layout.tsx        # Protected layout with role-aware sidebar
│   ├── trainer/                  # Trainer-only routes
│   │   ├── page.tsx              # Client list
│   │   └── clients/[id]/        # Per-client: dashboard, nutrition, workout, schedule, supplements, lab-results, progress
│   ├── client/                   # Client-only routes
│   │   ├── page.tsx              # Today's schedule (MAIN page — daily timeline)
│   │   ├── workout/              # Guided workout with exercise logging
│   │   ├── nutrition/            # Today's meal plan
│   │   └── log/                  # weight, body-comp, food, water, supplements
│   └── api/                      # Route Handlers
│       ├── auth/[...nextauth]/
│       ├── upload/
│       ├── trainer/, client/
│       └── export/pdf/
```

### User Roles

Two roles via `Role` enum: **TRAINER** and **CLIENT**. Trainer-client is a many-to-many relationship via `TrainerClient` junction table. Middleware protects dashboard routes and enforces role-based access.

### Database Schema (16 models)

- **Users:** User, TrainerClient
- **Nutrition:** NutritionPlan → Meal → MealOption, SupplementPlan
- **Workouts:** WorkoutPlan → Workout → Exercise/WarmupExercise, WeeklySchedule
- **Logs:** DailyLog (@@unique userId+date), WeightLog, BodyCompositionLog, LabResult → LabResultItem, WorkoutLog → ExerciseLog, MealLog, WaterLog, SupplementLog

Cascade deletes are configured on plan→child relationships. Full schema is in `prisma/schema.prisma`.

### Key Patterns

- **Server Components** by default; Client Components only where interactivity is needed
- Every page should have `loading.tsx` and `error.tsx`
- API layer uses Next.js Route Handlers (`app/api/`)
- Session-based auth via Auth.js middleware
- Nutrition plans differentiate between **training days** and **rest days** (different carb/fat macros, different meal sets)

## Conventions

- **Language:** All UI strings in Serbian Latin (e.g., "Ponedeljak", "Ručak", "Završi trening")
- **Date format:** DD.MM.YYYY (Serbian standard)
- **Path alias:** `@/*` maps to `src/`
- **Responsive:** Mobile-first. Breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)

## Design System

- **Theme:** Dark mode primary
  - Background: `#0a0a0f`, Text: `#e8e8ed`
  - Primary: `#6366f1` (indigo), Secondary: `#8b5cf6` (violet)
  - Success: `#22c55e`, Warning: `#f59e0b`, Danger: `#ef4444`
- **Typography:** DM Sans (body), Space Mono (numbers/codes)
- **Cards:** 16px border-radius, borders `rgba(255,255,255,0.08)`
- **Navigation:** Sticky tabs on tablet/desktop

## Environment Variables

```
DATABASE_URL=postgresql://fittrack:<password>@localhost:5432/fittrack
NEXTAUTH_SECRET=<random-secret>
NEXTAUTH_URL=http://localhost:3000
DB_PASSWORD=<password>
```

## Seed Data

The seed script creates real test data: trainer Jovana Đaković + client Dušan Stanković, a full nutrition plan with 5 meals/day (training and rest day variants), 3 workout programs (A/B/C split), weekly schedule, supplements, initial body composition, and lab results. See `fit-track-initial-CLAUDE_CODE_PROMPT.md` for complete seed data.

## Implementation Phases

**Phase 1 (MVP):** Auth, Prisma schema + seed, client daily schedule, guided workout, logging (meals/water/supplements/weight), trainer dashboard + plan editors, Docker deployment.

**Phase 2:** Google OAuth, push notifications, PDF lab result parsing, Recharts progress graphs, PWA offline, multi-client support, fitness tracker integration, PDF export.
