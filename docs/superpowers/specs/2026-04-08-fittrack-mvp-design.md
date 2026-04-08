# FitTrack MVP Design Spec

## Purpose

Full-stack fitness tracking platform connecting personal trainers with clients. Trainers create nutrition/workout plans; clients execute them and log daily progress. All UI in Serbian Latin.

## Tech Stack

- Next.js 15 (App Router, TypeScript)
- Tailwind CSS + shadcn/ui
- PostgreSQL 16 + Prisma ORM
- Auth.js v5 (CredentialsProvider, JWT strategy)
- react-hook-form + zod
- pnpm
- Docker Compose (app + db + nginx)

## Architecture

### Project Structure

```
src/
├── app/
│   ├── (auth)/login, register
│   ├── (dashboard)/layout.tsx        # Protected, role-aware sidebar
│   │   ├── trainer/                  # Trainer routes
│   │   │   ├── page.tsx              # Client list
│   │   │   └── clients/[id]/        # Dashboard, nutrition, workout, schedule, supplements, lab-results, progress
│   │   ├── client/                   # Client routes
│   │   │   ├── page.tsx              # Today's schedule (main page)
│   │   │   ├── workout/page.tsx      # Guided workout
│   │   │   ├── nutrition/page.tsx    # Today's meals
│   │   │   └── log/                  # weight, body-comp, food, water, supplements
│   │   └── api/                      # Route Handlers
│   ├── layout.tsx                    # Root (fonts, providers)
│   └── page.tsx                      # Redirect by role
├── components/
│   ├── ui/                           # shadcn/ui
│   └── ...                           # App-specific shared components
├── lib/
│   ├── prisma.ts                     # Singleton client
│   ├── auth.ts                       # Auth.js config
│   └── utils.ts
└── styles/globals.css
```

### Auth System

- `/login` — email + password, redirect to role-appropriate dashboard
- `/register` — open registration with role selection
- Middleware (`src/middleware.ts`):
  - Unauthenticated → `/login`
  - CLIENT on `/trainer/*` → `/client`
  - TRAINER on `/client/*` → `/trainer`
  - Already logged in on auth routes → redirect to dashboard
- JWT strategy with role in token/session

### Data Flow

- **Reads:** Server Components query Prisma directly
- **Writes:** Client Components → Route Handlers (zod validation) → Prisma
- **Revalidation:** `revalidatePath()` after mutations
- **File uploads:** `POST /api/upload` → `/uploads` directory

### Database

16 Prisma models as defined in `fit-track-initial-CLAUDE_CODE_PROMPT.md`:
- User, TrainerClient
- NutritionPlan → Meal → MealOption, SupplementPlan
- WorkoutPlan → Workout → Exercise/WarmupExercise, WeeklySchedule
- DailyLog (@@unique userId+date), WeightLog, BodyCompositionLog
- LabResult → LabResultItem
- WorkoutLog → ExerciseLog, MealLog, WaterLog, SupplementLog

## Client Pages

### Today's Schedule (`/client`) — Main Page

- Date header with training/rest day indicator
- Quick stats bar: water, protein, calories progress
- Vertical timeline with all activities by time:
  - Water reminders, workout link, meals with macros and options
  - Each meal shows P/C/F and expandable options
- Supplements checkbox list
- Daily goals checkboxes (water, meals, supplements, workout, steps) with live progress
- Quick action buttons: + water, + meal, + weight
- Training day vs rest day variants (different meals, no workout card on rest days)

### Guided Workout (`/client/workout`)

- Progress bar (completed/total exercises)
- Aktivacije section: warmup exercises with checkboxes, video links, completed ones fade
- Glavni deo section: exercises with ID, name, sets/reps, tempo note, video link
- Per-exercise logging: kg and reps inputs for each set (expand on tap)
- "Završi trening" button disabled until all exercises checked

### Logging Pages

- **Weight** (`/client/log/weight`): input + historical list/simple chart
- **Body composition** (`/client/log/body-comp`): full form matching BodyCompositionLog fields
- **Food diary** (`/client/log/food`): meal name, time, description, photo upload, on-plan toggle
- **Water** (`/client/log/water`): increment buttons (250mL, 500mL, custom), daily total
- **Supplements** (`/client/log/supplements`): checkbox list from active plan

### Other Client Pages

- **Nutrition** (`/client/nutrition`): today's meals with full options expanded
- **Lab results** (`/client/lab-results`): upload PDF, view history with status indicators
- **Progress** (`/client/progress`): weight/BF% history (table for MVP, charts Phase 2)

## Trainer Pages

### Client List (`/trainer`)

- Card per client: name, weight, compliance score, last active
- "Dodaj klijenta" button

### Client Dashboard (`/trainer/clients/[id]`)

- Overview cards: weight, BMI, BF%, compliance score
- 7-day compliance grid (green/red for workout, meals, water, supplements)
- Weight/BF% trends (table for MVP)
- Latest lab results with status dots
- Quick links to edit plans

### Plan Editors

- **Nutrition** (`/trainer/clients/[id]/nutrition`): macro targets, meal list with drag-and-drop reorder, meal options, rules textarea, supplement table
- **Workout** (`/trainer/clients/[id]/workout`): workout name/focus, warmup list, exercise list with all fields
- **Schedule** (`/trainer/clients/[id]/schedule`): 7-day grid with training/rest toggle and workout assignment

## Design System

- Dark theme: bg `#0a0a0f`, text `#e8e8ed`
- Primary `#6366f1` (indigo), Secondary `#8b5cf6` (violet)
- Success `#22c55e`, Warning `#f59e0b`, Danger `#ef4444`
- Fonts: DM Sans (body), Space Mono (numbers)
- Cards: 16px border-radius, borders `rgba(255,255,255,0.08)`
- Mobile-first responsive (<768, 768-1024, >1024)

## Conventions

- All UI strings in Serbian Latin
- Dates formatted DD.MM.YYYY
- `@/*` path alias for `src/`
- Server Components by default, Client Components only for interactivity
- Every page gets `loading.tsx` and `error.tsx`

## Implementation Order

1. Project scaffold + Prisma schema + Auth system + seed data
2. Client: today's schedule page
3. Client: guided workout
4. Client: logging pages (weight, water, food, supplements, body-comp)
5. Trainer: client dashboard
6. Trainer: plan editors (nutrition, workout, schedule)
7. Docker Compose deployment

## Seed Data

Full seed data is defined in `fit-track-initial-CLAUDE_CODE_PROMPT.md`:
- Trainer: Jovana Đaković (jovana@fittrack.rs)
- Client: Dušan Stanković (dusan@fittrack.rs)
- Complete nutrition plan with 5 meals/day (training + rest variants)
- 3 workout programs (A/B/C) with warmups and exercises
- Weekly schedule
- 6 supplements
- Initial body composition (25.03.2026)
- Lab results with 35+ values (28.03.2026)
