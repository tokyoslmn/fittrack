import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

function createPrismaClient() {
  const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
  });
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

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
      protein: 15,
      carbs: 0,
      fat: 0,
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
      protein: 25,
      carbs: 40,
      fat: 0,
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
      protein: 60,
      carbs: 45,
      fat: 25,
      icon: "🍽️",
      options: [
        {
          optionNumber: 1,
          description:
            "250g bela piletina na žaru + 250g krompir + salata + 20ml maslinovo ulje",
        },
        {
          optionNumber: 2,
          description:
            "200g crveno meso + 250g krompir ili 150g pirinac + salata + 20ml maslinovo ulje",
        },
      ],
    },
    {
      name: "Užina (Obrok 3)",
      time: "15:00",
      orderIndex: 3,
      isTrainingDay: true,
      protein: 40,
      carbs: 27,
      fat: 25,
      icon: "🍽️",
      options: [
        {
          optionNumber: 1,
          description:
            "100g tunjevina + 60g integralni hleb + 50g mladi sir + salata + 10ml maslinovo ulje",
        },
        {
          optionNumber: 2,
          description: "150-200g mesa od ručka + hleb + salata",
        },
        {
          optionNumber: 3,
          description:
            "2× proteinski jogurt/skyr + 100g borovnica + 40g badem",
        },
      ],
    },
    {
      name: "Večera (Obrok 4)",
      time: "21:00",
      orderIndex: 4,
      isTrainingDay: true,
      protein: 42,
      carbs: 35,
      fat: 20,
      icon: "🍽️",
      options: [
        {
          optionNumber: 1,
          description:
            "200g piletina + 150g krompir + 100g zeleno povrće + 15ml maslinovo ulje",
        },
        {
          optionNumber: 2,
          description: "100g tunjevina + 2 jaja + 80g pirinac + povrće",
        },
        {
          optionNumber: 3,
          description: "150g biftek + 200g krompir + salata",
        },
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
      protein: 20,
      carbs: 25,
      fat: 15,
      icon: "🍽️",
      options: [
        {
          optionNumber: 1,
          description: "Tost + jaja + maslinovo ulje + salata",
        },
        { optionNumber: 2, description: "Jogurt + borovnica + badem" },
        {
          optionNumber: 3,
          description: "Grčki jogurt + whey + kikiriki puter + borovnica",
        },
      ],
    },
    {
      name: "Ručak (Obrok 2)",
      time: "12:00",
      orderIndex: 1,
      isTrainingDay: false,
      protein: 60,
      carbs: 45,
      fat: 25,
      icon: "🍽️",
      options: [
        {
          optionNumber: 1,
          description:
            "250g bela piletina na žaru + 250g krompir + salata + 20ml maslinovo ulje",
        },
        {
          optionNumber: 2,
          description:
            "200g crveno meso + 250g krompir ili 150g pirinac + salata + 20ml maslinovo ulje",
        },
      ],
    },
    {
      name: "Užina (Obrok 3)",
      time: "15:00",
      orderIndex: 2,
      isTrainingDay: false,
      protein: 40,
      carbs: 27,
      fat: 25,
      icon: "🍽️",
      options: [
        {
          optionNumber: 1,
          description:
            "100g tunjevina + 60g integralni hleb + 50g mladi sir + salata + 10ml maslinovo ulje",
        },
        {
          optionNumber: 2,
          description: "150-200g mesa od ručka + hleb + salata",
        },
        {
          optionNumber: 3,
          description:
            "2× proteinski jogurt/skyr + 100g borovnica + 40g badem",
        },
      ],
    },
    {
      name: "Večera (Obrok 4)",
      time: "21:00",
      orderIndex: 3,
      isTrainingDay: false,
      protein: 42,
      carbs: 35,
      fat: 20,
      icon: "🍽️",
      options: [
        {
          optionNumber: 1,
          description:
            "200g piletina + 150g krompir + 100g zeleno povrće + 15ml maslinovo ulje",
        },
        {
          optionNumber: 2,
          description: "100g tunjevina + 2 jaja + 80g pirinac + povrće",
        },
        {
          optionNumber: 3,
          description: "150g biftek + 200g krompir + salata",
        },
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
    {
      name: "Whey protein",
      dose: "Po planu obroka",
      timing: "Uz obroke",
      icon: "🥛",
    },
    {
      name: "EAA/BCAA",
      dose: "15g",
      timing: "Intra workout",
      icon: "💪",
    },
    {
      name: "Omega 3 (Puori)",
      dose: "3 kapsule (2000mg EPA/DHA)",
      timing: "Uz obroke",
      icon: "🐟",
    },
    {
      name: "Vitamin D (Vigantol)",
      dose: "5000 IU",
      timing: "Dnevno, prvi mesec",
      icon: "☀️",
    },
    {
      name: "Magnezijum bisglicinat",
      dose: "300mg",
      timing: "Uveče",
      icon: "🌙",
    },
    {
      name: "Kreatin",
      dose: "5g",
      timing: "Kasnije uvesti",
      icon: "⚡",
    },
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
    {
      name: "Cat-Cow 2×15",
      videoUrl: "https://youtube.com/shorts/2of247Kt0tU",
      orderIndex: 0,
    },
    {
      name: "Plivanje sa poda 2×12",
      videoUrl: "https://youtube.com/shorts/8RJLYUH0akM",
      orderIndex: 1,
    },
    {
      name: "Kukovi 90-90 2×12",
      videoUrl: "https://youtube.com/shorts/PuxmfP2Rr74",
      orderIndex: 2,
    },
    {
      name: "Pigeon stretch 2×20s",
      videoUrl: "https://youtube.com/shorts/8RJLYUH0akM",
      orderIndex: 3,
    },
    {
      name: "Dead bug 2×12",
      videoUrl: "https://youtube.com/shorts/DqLL45uk2Tk",
      orderIndex: 4,
    },
    {
      name: "Hip thrust 2×12-15",
      videoUrl: "https://youtube.com/shorts/Ka0KbvsOKOs",
      orderIndex: 5,
    },
    {
      name: "Side plank 2×12",
      videoUrl: "https://youtube.com/shorts/OxUqMcC944g",
      orderIndex: 6,
    },
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
          {
            exerciseId: "A1",
            name: "Goblet čučanj",
            sets: "2×12",
            note: "5s na dole, jak core brace",
            videoUrl: "https://youtube.com/shorts/cuUPtfanAFQ",
            orderIndex: 0,
          },
          {
            exerciseId: "D1",
            name: "Horizontalno vučenje kablovi",
            sets: "2×12",
            note: "3s negativna faza",
            videoUrl: "https://youtube.com/shorts/LyZH4UGdDTc",
            orderIndex: 1,
          },
          {
            exerciseId: "E1",
            name: "Lat pull down široki",
            sets: "2×12",
            note: "3s negativna faza",
            videoUrl: "https://youtube.com/shorts/bNmvKpJSWKM",
            orderIndex: 2,
          },
          {
            exerciseId: "F1",
            name: "Shoulder press",
            sets: "2×12",
            videoUrl: "https://youtube.com/shorts/k6tzKisR3NY",
            orderIndex: 3,
          },
          {
            exerciseId: "G1",
            name: "Biceps pregib",
            sets: "2×12",
            orderIndex: 4,
          },
          {
            exerciseId: "H1",
            name: "Triceps ekstenzija",
            sets: "2×12",
            orderIndex: 5,
          },
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
          {
            exerciseId: "A1",
            name: "Prednji čučanj",
            sets: "2×6",
            note: "20s izdržaj na dnu, lagana kilaža",
            orderIndex: 0,
          },
          {
            exerciseId: "B1",
            name: "Hodajući iskorak bučice",
            sets: "2×12",
            videoUrl: "https://youtube.com/shorts/f7Aw2yiqmVs",
            orderIndex: 1,
          },
          {
            exerciseId: "C1",
            name: "RDL sa bučicama",
            sets: "2×12",
            videoUrl: "https://youtube.com/shorts/g646-pldmcc",
            orderIndex: 2,
          },
          {
            exerciseId: "D1",
            name: "Lat pull down uski",
            sets: "2×12",
            note: "3s na dole",
            orderIndex: 3,
          },
          {
            exerciseId: "E1",
            name: "Incline bench press bučice",
            sets: "2×12",
            note: "3s na dole",
            videoUrl: "https://youtube.com/shorts/8fXfwG4ftaQ",
            orderIndex: 4,
          },
          {
            exerciseId: "F1",
            name: "Pec dec mašina",
            sets: "2×12",
            note: "2s zadržaj",
            videoUrl: "https://youtube.com/shorts/a9vQ_hwIksU",
            orderIndex: 5,
          },
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
          {
            exerciseId: "A1",
            name: "Abdukcija mašina",
            sets: "2×15",
            note: "3s negativna faza, može jače",
            orderIndex: 0,
          },
          {
            exerciseId: "B1",
            name: "Adukcija",
            sets: "2×15",
            note: "3s negativna faza",
            orderIndex: 1,
          },
          {
            exerciseId: "C1",
            name: "Hodajući iskorak",
            sets: "2×12",
            orderIndex: 2,
          },
          {
            exerciseId: "D1",
            name: "Bench press šipka",
            sets: "2×12",
            videoUrl: "https://youtube.com/shorts/_FkbD0FhgVE",
            orderIndex: 3,
          },
          {
            exerciseId: "E1",
            name: "Unilateralno veslanje bučice",
            sets: "2×12",
            videoUrl: "https://youtube.com/shorts/yHqqGd0tXcw",
            orderIndex: 4,
          },
          {
            exerciseId: "F1",
            name: "Letenje",
            sets: "2×12",
            note: "3s na dole",
            videoUrl: "https://youtube.com/shorts/rk8YayRoTRQ",
            orderIndex: 5,
          },
          {
            exerciseId: "G1",
            name: "Face pull",
            sets: "2×12",
            videoUrl: "https://youtube.com/shorts/IeOqdw9WI90",
            orderIndex: 6,
          },
        ],
      },
    },
  });

  // Weekly Schedule
  const schedule = [
    {
      dayOfWeek: 0,
      dayName: "Ponedeljak",
      type: "training",
      workoutId: workoutA.id,
      label: "Trening A",
    },
    {
      dayOfWeek: 1,
      dayName: "Utorak",
      type: "rest",
      workoutId: null,
      label: "Odmor / Šetnja",
      restNotes: "Min 5000-7000 koraka",
    },
    {
      dayOfWeek: 2,
      dayName: "Sreda",
      type: "training",
      workoutId: workoutB.id,
      label: "Trening B",
    },
    {
      dayOfWeek: 3,
      dayName: "Četvrtak",
      type: "rest",
      workoutId: null,
      label: "Odmor / Šetnja",
      restNotes: "Min 5000-7000 koraka",
    },
    {
      dayOfWeek: 4,
      dayName: "Petak",
      type: "training",
      workoutId: workoutC.id,
      label: "Trening C",
    },
    {
      dayOfWeek: 5,
      dayName: "Subota",
      type: "rest",
      workoutId: null,
      label: "Odmor / Šetnja",
      restNotes: "Min 5000-7000 koraka",
    },
    {
      dayOfWeek: 6,
      dayName: "Nedelja",
      type: "rest",
      workoutId: null,
      label: "Odmor / Šetnja",
      restNotes: "Min 5000-7000 koraka",
    },
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
    {
      category: "Krvna slika",
      name: "Leukociti",
      value: 5.9,
      unit: "×10⁹/L",
      refRange: "3.5-10.0",
      status: "ok",
    },
    {
      category: "Krvna slika",
      name: "Eritrociti",
      value: 4.93,
      unit: "×10¹²/L",
      refRange: "3.80-6.30",
      status: "ok",
    },
    {
      category: "Krvna slika",
      name: "Hemoglobin",
      value: 151,
      unit: "g/L",
      refRange: "120-180",
      status: "ok",
    },
    {
      category: "Krvna slika",
      name: "Trombociti",
      value: 239,
      unit: "×10⁹/L",
      refRange: "140-440",
      status: "ok",
    },
    // Dijabetes
    {
      category: "Dijabetes",
      name: "Glukoza",
      value: 5.6,
      unit: "mmol/L",
      refRange: "3.9-5.9",
      status: "warn",
    },
    {
      category: "Dijabetes",
      name: "HbA1c",
      value: 5.3,
      unit: "%",
      refRange: "4.0-5.9",
      status: "ok",
    },
    {
      category: "Dijabetes",
      name: "Insulin",
      value: 15.5,
      unit: "mIU/L",
      refRange: "2.6-24.9",
      status: "ok",
    },
    {
      category: "Dijabetes",
      name: "HOMA-IR",
      value: 3.86,
      unit: "",
      refRange: "<2.5",
      status: "high",
    },
    // Lipidi
    {
      category: "Lipidni status",
      name: "HDL",
      value: 1.24,
      unit: "mmol/L",
      refRange: ">1.00",
      status: "ok",
    },
    {
      category: "Lipidni status",
      name: "LDL",
      value: 4.17,
      unit: "mmol/L",
      refRange: "<4.10",
      status: "high",
    },
    {
      category: "Lipidni status",
      name: "Trigliceridi",
      value: 1.06,
      unit: "mmol/L",
      refRange: "<1.70",
      status: "ok",
    },
    {
      category: "Lipidni status",
      name: "Index ateroskleroze",
      value: 3.4,
      unit: "",
      refRange: "<3.00",
      status: "high",
    },
    {
      category: "Lipidni status",
      name: "APO-B",
      value: 119,
      unit: "mg/dL",
      refRange: "66-133",
      status: "warn",
    },
    // Biohemija
    {
      category: "Biohemija",
      name: "Urea",
      value: 4.6,
      unit: "mmol/L",
      refRange: "2.5-8.3",
      status: "ok",
    },
    {
      category: "Biohemija",
      name: "Kreatinin",
      value: 95,
      unit: "µmol/L",
      refRange: "62-115",
      status: "ok",
    },
    {
      category: "Biohemija",
      name: "eGFR",
      value: 75,
      unit: "mL/min",
      refRange: ">60",
      status: "ok",
    },
    {
      category: "Biohemija",
      name: "AST",
      value: 28,
      unit: "U/L",
      refRange: "0-40",
      status: "ok",
    },
    {
      category: "Biohemija",
      name: "ALT",
      value: 39,
      unit: "U/L",
      refRange: "0-41",
      status: "ok",
    },
    {
      category: "Biohemija",
      name: "Gama GT",
      value: 23,
      unit: "U/L",
      refRange: "8-61",
      status: "ok",
    },
    // Hormoni
    {
      category: "Hormoni",
      name: "TSH",
      value: 2.66,
      unit: "mIU/L",
      refRange: "0.27-4.20",
      status: "ok",
    },
    {
      category: "Hormoni",
      name: "FT4",
      value: 13.8,
      unit: "pmol/L",
      refRange: "12-22",
      status: "warn",
    },
    {
      category: "Hormoni",
      name: "T3",
      value: 1.6,
      unit: "nmol/L",
      refRange: "1.2-3.1",
      status: "warn",
    },
    {
      category: "Hormoni",
      name: "Testosteron",
      value: 14.0,
      unit: "nmol/L",
      refRange: "9.90-27.80",
      status: "warn",
    },
    {
      category: "Hormoni",
      name: "SHBG",
      value: 20.2,
      unit: "nmol/L",
      refRange: "18.3-76.7",
      status: "warn",
    },
    {
      category: "Hormoni",
      name: "Kortizol",
      value: 301,
      unit: "nmol/L",
      refRange: "166-507",
      status: "ok",
    },
    // Vitamini i minerali
    {
      category: "Vitamini i minerali",
      name: "Vitamin D",
      value: 36.2,
      unit: "nmol/L",
      refRange: "75-250",
      status: "low",
    },
    {
      category: "Vitamini i minerali",
      name: "B12",
      value: 288,
      unit: "pmol/L",
      refRange: "138-652",
      status: "ok",
    },
    {
      category: "Vitamini i minerali",
      name: "Gvožđe",
      value: 18.8,
      unit: "µmol/L",
      refRange: "11.6-31.3",
      status: "ok",
    },
    {
      category: "Vitamini i minerali",
      name: "Feritin",
      value: 140,
      unit: "µg/L",
      refRange: "30-400",
      status: "ok",
    },
    {
      category: "Vitamini i minerali",
      name: "Fosfor",
      value: 1.2,
      unit: "mmol/L",
      refRange: "0.81-1.45",
      status: "ok",
    },
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
