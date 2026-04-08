# FitTrack — Inicijalni Prompt za Claude Code

## Instrukcija za Claude Code

Pravi full-stack web aplikaciju "FitTrack" — platforma za personalizovano praćenje treninga, ishrane i zdravstvenih parametara. Aplikacija povezuje trenera (koji kreira planove) i klijenta (koji ih prati i loguje napredak). Cilj je da klijent u svakom trenutku zna tačno šta treba da radi, a da trener ima uvid u progres u realnom vremenu.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack, TypeScript)
- **UI:** Tailwind CSS + shadcn/ui
- **Baza:** PostgreSQL
- **ORM:** Prisma
- **Auth:** Auth.js v5 (email + password za MVP; pripremi Google OAuth provider za fazu 2)
- **File upload:** Local filesystem (`/uploads` na serveru), Next.js API route za upload
- **Deployment:** Docker Compose (Next.js + PostgreSQL + Nginx reverse proxy)
- **PWA:** next-pwa (service worker za offline-lite i "Add to Home Screen")
- **Jezik interfejsa:** Srpski (svi labeli, poruke, placeholder-i na srpskom)
- **PDF export:** `@react-pdf/renderer` ili `puppeteer` za generisanje PDF izveštaja

---

## Korisničke Role

### 1. Trener (TRAINER)
- Kreira i upravlja profilima klijenata
- Pravi planove ishrane sa: obrocima po satima, opcijama za svaki obrok, makrosima (P/C/F) po obroku, pravilima ishrane, razlikom za trening dane i dane odmora
- Pravi planove treninga sa: vežbama, brojem serija/ponavljanja, napomenama o tempu izvođenja, YouTube linkovima za demonstraciju, aktivacijama/mobilnošću pre treninga
- Definiše nedeljni raspored (koji dani su trening, koji odmor)
- Definiše suplementaciju (naziv, doza, tajming)
- Vidi dashboard svakog klijenta: težinu, telesnu kompoziciju, laboratorijske rezultate, compliance (da li je uradio trening, pojeo sve obroke, popio vodu, uzeo suplemente)
- Može da modifikuje plan u bilo kom trenutku
- Opciono: export PDF izveštaja za klijenta

### 2. Klijent (CLIENT)
- Vidi dnevni raspored sa satnicom: šta treba da jede, kada treniram, koliko vode da popije, koji suplemente da uzme
- Vođeni trening: svaka vežba ima opis, video link, napomenu, i checkbox za markiranje kao završenu
- Loguje obroke: šta je jeo, opciono foto, može da bira iz predefinisanih opcija trenera ili unese slobodno
- Loguje unos vode (u mL ili L, inkrementalno)
- Loguje suplemente (checkbox lista za dnevnu dozu)
- Loguje telesne mere: težina, telesna mast (%), mišićna masa (kg), visceralna mast, obim struka, i ostali parametri sa body composition vage
- Uploaduje laboratorijske rezultate (PDF fajl) — periodično, sa datumom
- Vidi sopstveni napredak: grafik težine, trend telesne masti, istoriju lab rezultata
- Vidi dnevne checkboxe: voda ✓, obroci ✓, trening ✓, suplementi ✓, koraci ✓

---

## Struktura Baze (Prisma Schema)

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
  password      String    // bcrypt hash
  name          String
  role          Role
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Trainer relations
  clients       TrainerClient[] @relation("TrainerRelation")
  createdPlans  NutritionPlan[]
  createdWorkoutPlans WorkoutPlan[]

  // Client relations
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

// ─── NUTRITION PLAN ──────────────────────────────────────────

model NutritionPlan {
  id          String   @id @default(cuid())
  trainerId   String
  clientId    String
  name        String   // npr. "Recompozicija - Faza 1"
  active      Boolean  @default(true)
  totalProtein    Int    // g
  totalCarbsTrain Int    // g na trening dan
  totalCarbsRest  Int    // g na dan odmora
  totalFatTrain   Int    // g na trening dan
  totalFatRest    Int    // g na dan odmora
  totalKcalMin    Int
  totalKcalMax    Int
  rules       String   // JSON string sa pravilima ishrane
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  trainer     User     @relation(fields: [trainerId], references: [id])
  meals       Meal[]
  supplements SupplementPlan[]
}

model Meal {
  id              String   @id @default(cuid())
  planId          String
  name            String   // npr. "Post workout (Obrok 1)"
  time            String   // npr. "08:50" ili "12:00"
  orderIndex      Int      // redosled u danu
  isTrainingDay   Boolean  // true = trening dan obrok, false = dan odmora
  protein         Int      // g
  carbs           Int      // g
  fat             Int      // g
  icon            String?  // emoji

  plan            NutritionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
  options         MealOption[]
}

model MealOption {
  id          String   @id @default(cuid())
  mealId      String
  optionNumber Int     // 1, 2, 3...
  description String   // npr. "250g bela piletina na žaru + 250g krompir + salata + 20ml maslinovo ulje"

  meal        Meal     @relation(fields: [mealId], references: [id], onDelete: Cascade)
}

model SupplementPlan {
  id          String   @id @default(cuid())
  planId      String
  name        String   // npr. "Omega 3 (Puori)"
  dose        String   // npr. "3 kapsule (2000mg EPA/DHA)"
  timing      String   // npr. "Uz obroke"
  icon        String?

  plan        NutritionPlan @relation(fields: [planId], references: [id], onDelete: Cascade)
}

// ─── WORKOUT PLAN ────────────────────────────────────────────

model WorkoutPlan {
  id          String   @id @default(cuid())
  trainerId   String
  clientId    String
  name        String   // npr. "Recompozicija - Faza 1"
  active      Boolean  @default(true)
  notes       String?  // generalne napomene
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  trainer     User     @relation(fields: [trainerId], references: [id])
  schedule    WeeklySchedule[]
  workouts    Workout[]
}

model WeeklySchedule {
  id          String   @id @default(cuid())
  planId      String
  dayOfWeek   Int      // 0=Ponedeljak, 1=Utorak... 6=Nedelja
  dayName     String   // "Ponedeljak"
  type        String   // "training" ili "rest"
  workoutId   String?  // referenca na Workout ako je trening dan
  label       String   // npr. "Trening A" ili "Odmor / Šetnja"
  restNotes   String?  // npr. "Min 5000-7000 koraka"

  plan        WorkoutPlan  @relation(fields: [planId], references: [id], onDelete: Cascade)
  workout     Workout?     @relation(fields: [workoutId], references: [id])
}

model Workout {
  id          String   @id @default(cuid())
  planId      String
  name        String   // npr. "Trening A"
  focus       String   // npr. "Čučanj / Vučenje / Ramena"
  orderIndex  Int

  plan        WorkoutPlan     @relation(fields: [planId], references: [id], onDelete: Cascade)
  warmups     WarmupExercise[]
  exercises   Exercise[]
  scheduleDays WeeklySchedule[]
}

model WarmupExercise {
  id          String   @id @default(cuid())
  workoutId   String
  name        String   // npr. "Cat-Cow 2×15"
  videoUrl    String?  // YouTube link
  orderIndex  Int

  workout     Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
}

model Exercise {
  id          String   @id @default(cuid())
  workoutId   String
  exerciseId  String   // npr. "A1", "B1"
  name        String   // npr. "Goblet čučanj"
  sets        String   // npr. "2×12"
  note        String?  // npr. "5s na dole, jak core brace"
  videoUrl    String?  // YouTube link
  orderIndex  Int

  workout     Workout  @relation(fields: [workoutId], references: [id], onDelete: Cascade)
}

// ─── CLIENT LOGS ─────────────────────────────────────────────

model WeightLog {
  id        String   @id @default(cuid())
  userId    String
  date      DateTime
  weight    Float    // kg
  note      String?
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id])
}

model BodyCompositionLog {
  id              String   @id @default(cuid())
  userId          String
  date            DateTime
  weight          Float?
  bodyFatPct      Float?   // %
  fatMass         Float?   // kg
  muscleMass      Float?   // kg
  musclePct       Float?   // %
  skeletalMuscle  Float?   // kg
  bodyWater       Float?   // %
  visceralFat     Float?
  bmr             Int?     // kcal
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
  labName     String?  // npr. "Euromedik"
  protocolNum String?  // npr. "14468878"
  filePath    String?  // putanja do uploadovanog PDF-a
  notes       String?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  items       LabResultItem[]
}

model LabResultItem {
  id          String   @id @default(cuid())
  resultId    String
  category    String   // npr. "Lipidni status"
  name        String   // npr. "LDL"
  value       Float
  unit        String   // npr. "mmol/L"
  refRange    String   // npr. "<4.10"
  status      String   // "ok", "warn", "high", "low"

  result      LabResult @relation(fields: [resultId], references: [id], onDelete: Cascade)
}

model DailyLog {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime
  waterMl     Int      @default(0)    // ukupno vode u mL
  steps       Int?                     // koraci
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
  workoutId   String?  // koji trening
  completed   Boolean  @default(false)
  duration    Int?     // minuta
  notes       String?
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
  exerciseLogs ExerciseLog[]
}

model ExerciseLog {
  id            String   @id @default(cuid())
  workoutLogId  String
  exerciseId    String   // referenca na Exercise
  completed     Boolean  @default(false)
  weight        Float?   // kg korisćena
  reps          String?  // odrađeni ponavljanja
  notes         String?

  workoutLog    WorkoutLog @relation(fields: [workoutLogId], references: [id], onDelete: Cascade)
}

model MealLog {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime
  mealName    String   // npr. "Ručak"
  time        String?  // stvarno vreme kada je jeo
  description String   // šta je jeo
  photoPath   String?  // putanja do slike
  onPlan      Boolean  @default(true) // da li je po planu
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}

model WaterLog {
  id          String   @id @default(cuid())
  userId      String
  date        DateTime
  amountMl    Int      // količina u mL
  time        String?  // vreme unosa
  createdAt   DateTime @default(now())

  user        User     @relation(fields: [userId], references: [id])
}

model SupplementLog {
  id              String   @id @default(cuid())
  userId          String
  date            DateTime
  supplementName  String   // ime suplementa
  taken           Boolean  @default(false)
  createdAt       DateTime @default(now())

  user            User     @relation(fields: [userId], references: [id])
}
```

---

## Struktura Stranica (App Router)

```
app/
├── (auth)/
│   ├── login/page.tsx            # Login forma
│   └── register/page.tsx         # Registracija (samo za trenere koji pozivaju klijente)
│
├── (dashboard)/
│   ├── layout.tsx                # Sidebar + header sa role-aware navigacijom
│   │
│   ├── trainer/
│   │   ├── page.tsx              # Lista klijenata sa statusima
│   │   ├── clients/[id]/
│   │   │   ├── page.tsx          # Dashboard klijenta (težina, compliance, lab alerts)
│   │   │   ├── nutrition/page.tsx    # Editor plana ishrane
│   │   │   ├── workout/page.tsx      # Editor plana treninga
│   │   │   ├── schedule/page.tsx     # Editor nedeljnog rasporeda
│   │   │   ├── supplements/page.tsx  # Editor suplementacije
│   │   │   ├── lab-results/page.tsx  # Pregled lab rezultata klijenta
│   │   │   └── progress/page.tsx     # Grafici napretka (težina, BF%, compliance)
│   │   └── settings/page.tsx     # Profil trenera
│   │
│   ├── client/
│   │   ├── page.tsx              # Današnji dan: satnica, checkboxovi, šta sad treba
│   │   ├── workout/page.tsx      # Vođeni trening (današnji, sa checkboxima)
│   │   ├── nutrition/page.tsx    # Današnji plan ishrane (obrok po obrok)
│   │   ├── log/
│   │   │   ├── weight/page.tsx       # Unos težine + grafik
│   │   │   ├── body-comp/page.tsx    # Unos telesne kompozicije
│   │   │   ├── food/page.tsx         # Dnevnik ishrane
│   │   │   ├── water/page.tsx        # Praćenje vode
│   │   │   └── supplements/page.tsx  # Checkbox suplementi
│   │   ├── lab-results/page.tsx  # Upload i pregled lab rezultata
│   │   ├── progress/page.tsx     # Moj napredak (grafici, istorija)
│   │   └── settings/page.tsx     # Profil klijenta
│   │
│   └── api/
│       ├── auth/[...nextauth]/route.ts
│       ├── upload/route.ts       # File upload (lab PDFs, slike obroka)
│       ├── trainer/              # CRUD za planove
│       ├── client/               # Logovi, daily checks
│       └── export/pdf/route.ts   # PDF generisanje
```

---

## Ključne Stranice — Detaljan Opis

### Klijent: Današnji Dan (`/client`)
Ovo je GLAVNA stranica klijenta. Prikazuje:
1. **Header:** Datum, da li je trening dan ili odmor, ime treninga
2. **Satnica (timeline):** Vertikalni timeline sa svim aktivnostima po satima:
   - 07:30 — Pola litra vode po buđenju
   - 08:00 — Trening (link ka /client/workout)
   - 08:30 — Intra workout shake (15g EAA)
   - 08:50 — Post workout obrok (opcije prikazane)
   - 12:00 — Ručak (opcije prikazane)
   - 15:00 — Užina (opcije prikazane)
   - 21:00 — Večera (opcije prikazane)
   - Tokom dana: suplementi (checkbox lista)
3. **Quick actions:** Dugmad za brzo logovanje (+ vode, + obrok, + težina)
4. **Dnevni checkboxovi:**
   - [ ] Voda (3-4L) — prikazuje koliko je uneo do sad
   - [ ] Svi obroci po planu
   - [ ] Suplementi
   - [ ] Trening (ako je trening dan)
   - [ ] Koraci (5000-7000)

### Klijent: Vođeni Trening (`/client/workout`)
1. Prikazuje današnji trening (A, B, ili C po rasporedu)
2. **Deo 1 — Aktivacije/Mobilnost:** Lista sa checkboxovima, svaka ima YouTube link
3. **Deo 2 — Glavni deo:** Svaka vežba prikazuje:
   - Naziv + ID (npr. A1 - Goblet čučanj)
   - Setovi/ponavljanja (2×12)
   - Napomena o tempu (npr. "5s na dole, jak core brace")
   - YouTube video link (otvara u novom tabu)
   - Checkbox: ☐ Završeno
   - Opciono: input za kilažu korišćenu
4. Na kraju: dugme "Završi trening" koje loguje ceo trening

### Trener: Dashboard Klijenta (`/trainer/clients/[id]`)
1. **Overview kartice:** Trenutna težina, trend, BMI, BF%, compliance score (% završenih dnevnih ciljeva ove nedelje)
2. **Nedeljni pregled:** 7 dana sa zelenim/crvenim indikatorima (trening ✓/✗, ishrana ✓/✗, voda ✓/✗)
3. **Grafici:** Težina (linijski), telesna mast (linijski), HOMA-IR (ako ima lab podatke)
4. **Poslednji laboratorijski rezultati:** Upozorenja na vrednosti van opsega
5. **Quick link:** Izmeni plan ishrane, izmeni plan treninga

### Trener: Editor Plana Ishrane (`/trainer/clients/[id]/nutrition`)
Forma sa:
- Ukupni makrosi (P/C_train/C_rest/F_train/F_rest/kcal range)
- Lista obroka: za svaki obrok (drag-and-drop za reorder):
  - Naziv, vreme, protein/carbs/fat, trening dan (da/ne)
  - Opcije (1, 2, 3...) sa tekstualnim opisom
- Pravila ishrane (rich text ili lista)
- Suplementi: naziv, doza, tajming, ikona

---

## Inicijalni Seed Data

Koristi sledeće podatke za seed baze (ovo su stvarni podaci iz protokola trenera Jovane Đaković za klijenta Dušana Stankovića). Seed skripta treba da kreira:

### Korisnike:
- Trener: Jovana Đaković (jovana@fittrack.rs)
- Klijent: Dušan Stanković (dusan@fittrack.rs, datum rođenja: 18.08.1980.)

### Plan ishrane:
- Naziv: "Smanjenje masti / Rekompozicija — Faza 1"
- Ukupno: P=170g, C=150g(trening)/135g(odmor), F=70g(trening)/85g(odmor), 1910-1985 kcal
- Obroci trening dan:
  1. Intra workout (~08:30) — P:15 C:0 F:0 — 15g EAA, 5g kreatin
  2. Post workout (~08:50) — P:25 C:40 F:0 — 30g whey, 200g banana
  3. Ručak (12:00) — P:60 C:45 F:25 — Opcija 1: 250g piletina + 250g krompir/150g pirinac + salata + 20ml maslinovo ulje; Opcija 2: 200g crveno meso + isto
  4. Užina (15:00-16:00) — P:40 C:27 F:25 — Opcija 1: 100g tunjevina + 60g integralni hleb + 50g mladi sir + salata + 10ml ulje; Opcija 2: 150-200g mesa od ručka + hleb + salata; Opcija 3: 2× proteinski jogurt/skyr + 100g borovnica + 40g badem
  5. Večera (21:00) — P:42 C:35 F:20 — Opcija 1: 200g piletina + 150g krompir + 100g zeleno povrće + 15ml ulje; Opcija 2: 100g tunjevina + 2 jaja + 80g pirinac + povrće; Opcija 3: 150g biftek + 200g krompir + salata
- Obroci dan odmora: isti ručak/užina/večera, ali doručak (09:00) — P:20 C:25 F:15 — Opcija 1: tost + jaja + ulje + salata; Opcija 2: jogurt + borovnica + badem; Opcija 3: grčki jogurt + whey + kikiriki puter + borovnica
- Pravila: meriti sve precizno, kuvano se meri posle pripreme, sirovo se meri sirovo, maslinovo ulje za salate, kokosovo/puter za grilovanje, bez suncokretovog ulja, kafa OK bez šećera, 3-4L vode dnevno, pola litra ujutru, svi začini OK, salate ne moraju da se vagaju

### Plan treninga:
- Trening A (Ponedeljak): Čučanj / Vučenje / Ramena
  - Aktivacije: Cat-Cow 2×15 (https://youtube.com/shorts/2of247Kt0tU), Plivanje sa poda 2×12 (https://youtube.com/shorts/8RJLYUH0akM), Kukovi 90-90 2×12 (https://youtube.com/shorts/PuxmfP2Rr74), Pigeon stretch 2×20s (https://youtube.com/shorts/8RJLYUH0akM), Dead bug 2×12 (https://youtube.com/shorts/DqLL45uk2Tk), Hip thrust 2×12-15 (https://youtube.com/shorts/Ka0KbvsOKOs), Side plank 2×12 (https://youtube.com/shorts/OxUqMcC944g)
  - Vežbe: A1-Goblet čučanj 2×12 (5s na dole, core brace) (https://youtube.com/shorts/cuUPtfanAFQ), D1-Horizontalno vučenje kablovi 2×12 (3s neg) (https://youtube.com/shorts/LyZH4UGdDTc), E1-Lat pull down široki 2×12 (3s neg) (https://youtube.com/shorts/bNmvKpJSWKM), F1-Shoulder press 2×12 (https://youtube.com/shorts/k6tzKisR3NY), G1-Biceps pregib 2×12, H1-Triceps ekstenzija 2×12

- Trening B (Sreda): Iskoraci / Grudi / Leđa
  - Iste aktivacije
  - Vežbe: A1-Prednji čučanj 2×6 (20s izdržaj, lagana kilaža), B1-Hodajući iskorak bučice 2×12 (https://youtube.com/shorts/f7Aw2yiqmVs), C1-RDL sa bučicama 2×12 (https://youtube.com/shorts/g646-pldmcc), D1-Lat pull down uski 2×12 (3s na dole), E1-Incline bench press bučice 2×12 (3s na dole) (https://youtube.com/shorts/8fXfwG4ftaQ), F1-Pec dec mašina 2×12 (2s zadržaj) (https://youtube.com/shorts/a9vQ_hwIksU)

- Trening C (Petak): Abduktori / Bench / Veslanje
  - Iste aktivacije
  - Vežbe: A1-Abdukcija mašina 2×15 (3s neg, može jače), B1-Adukcija 2×15 (3s neg), C1-Hodajući iskorak 2×12, D1-Bench press šipka 2×12 (https://youtube.com/shorts/_FkbD0FhgVE), E1-Unilateralno veslanje bučice 2×12 (https://youtube.com/shorts/yHqqGd0tXcw), F1-Letenje 2×12 (3s na dole) (https://youtube.com/shorts/rk8YayRoTRQ), G1-Face pull 2×12 (https://youtube.com/shorts/IeOqdw9WI90)

- Raspored: Pon=A, Uto=odmor, Sre=B, Čet=odmor, Pet=C, Sub=odmor, Ned=odmor

### Suplementi:
- Whey protein — po planu obroka — uz obroke
- EAA/BCAA — 15g — intra workout
- Omega 3 (Puori) — 3 kapsule (2000mg EPA/DHA) — uz obroke
- Vitamin D (Vigantol) — 5000 IU — dnevno, prvi mesec
- Magnezijum bisglicinat — 300mg — uveče
- Kreatin — 5g — kasnije uvesti

### Inicijalna telesna kompozicija (25.03.2026):
- Težina: 105.6kg, BMI: 32.2, Body fat: 30.5%, Fat mass: 32.2kg
- Mišićna masa: 69.3kg (65.6%), Skeletna mišićna masa: 41.5kg
- Voda: 53.2%, Protein: 12.2%, Kosti: 4.1kg
- Visceralna mast: 14 (vrlo visoko), BMR: 1955 kcal
- Struk/kuk: 0.9, Puls: 83 bpm
- Ciljna težina: 70.7kg, Potreban gubitak masti: -21.6kg

### Laboratorijski rezultati (28.03.2026, Euromedik, protokol 14468878/14468939):
Krvna slika: Leukociti 5.9 (3.5-10.0, ok), Eritrociti 4.93 (3.80-6.30, ok), Hemoglobin 151 (120-180, ok), Trombociti 239 (140-440, ok)
Dijabetes: Glukoza 5.6 (3.9-5.9, warn), HbA1c 5.3% (4.0-5.9, ok), Insulin 15.5 (2.6-24.9, ok), HOMA-IR=3.86 (izračunato, >2.5 = insulinska rezistencija)
Lipidi: HDL 1.24 (>1.00, ok), LDL 4.17 (<4.10, high), Trigliceridi 1.06 (<1.70, ok), Index ateroskleroze 3.40 (<3.00, high), APO-B 119 (66-133, warn)
Biohemija: Urea 4.6 (ok), Kreatinin 95 (ok), eGFR 75 (ok), AST 28 (ok), ALT 39 (ok), Gama GT 23 (ok)
Hormoni: TSH 2.66 (ok), FT4 13.8 (12-22, warn-donji), T3 1.6 (1.2-3.1, warn-donji), Testosteron 14.00 (9.90-27.80, warn-donji), SHBG 20.2 (18.3-76.7, warn-donji), Kortizol 301 (ok)
Vitamini: Vitamin D 36.2 (insuficijencija, cilj 75-250), B12 288 (ok), Gvožđe 18.8 (ok), Feritin 140 (ok), Fosfor 1.20 (ok)

---

## Docker Compose Setup

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://fittrack:${DB_PASSWORD}@db:5432/fittrack
      - NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
      - NEXTAUTH_URL=${NEXTAUTH_URL}
    volumes:
      - ./uploads:/app/uploads
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_USER=fittrack
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      - POSTGRES_DB=fittrack
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./certbot:/etc/letsencrypt
    depends_on:
      - app
    restart: unless-stopped

volumes:
  pgdata:
```

---

## Prioriteti Implementacije

### Faza 1 (MVP):
1. Auth (email + password), role system
2. Prisma schema + seed data
3. Klijent: Današnji dan sa satnicom
4. Klijent: Vođeni trening sa checkboxima i video linkovima
5. Klijent: Logovanje obroka, vode, suplemenata, težine
6. Trener: Dashboard klijenta (pregled logova i compliance-a)
7. Trener: Editor plana ishrane i treninga
8. Docker Compose deployment

### Faza 2:
- Google OAuth login
- Push notifikacije
- Upload i parsiranje lab rezultata (PDF)
- Grafici napretka (recharts)
- PWA offline support
- Multi-klijent za trenere
- Integracija sa fitnes satovima/trackerima
- PDF export izveštaja

---

## Dizajn Smernice

- Dark tema (pozadina #0a0a0f, tekst #e8e8ed)
- Accent boje: indigo #6366f1 (primary), violet #8b5cf6 (secondary), green #22c55e (success), amber #f59e0b (warning), red #ef4444 (danger)
- Font: DM Sans za tekst, Space Mono za brojeve/kodove
- Kartice sa border-radius: 16px, suptilne granice rgba(255,255,255,0.08)
- Mobile-first responsive dizajn
- Sticky tab navigacija
- Animacije: fadeIn za promene tabova
- Status indikatori: zelena/žuta/crvena tačkica za lab vrednosti
- Progress barovi za praćenje dnevnih ciljeva

---

## Napomene za Claude Code

1. Koristi `pnpm` kao package manager
2. Svi stringovi u UI-ju su na srpskom jeziku (ćirilica NIJE potrebna, koristimo latinicu)
3. Sve datume formatiraj kao DD.MM.YYYY (srpski format)
4. API rute koriste Next.js Route Handlers (app/api/)
5. Server Components gde god je moguće, Client Components samo gde treba interaktivnost
6. Validacija formi: zod + react-hook-form
7. Svaka stranica ima loading.tsx i error.tsx
8. Responsive breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
