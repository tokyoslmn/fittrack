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
  const meals =
    nutritionPlan?.meals.filter((m) => m.isTrainingDay === isTrainingDay) ?? [];

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

export async function getWeekSchedule(userId: string, weekOffset = 0) {
  // Calculate Monday of the target week
  const now = new Date();
  const jsDay = now.getDay();
  const mondayOffset = jsDay === 0 ? 6 : jsDay - 1;
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  monday.setDate(monday.getDate() - mondayOffset + weekOffset * 7);

  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 7);

  // Fetch plans
  const [nutritionPlan, workoutPlan, waterLogs, supplementLogs, workoutLogs] =
    await Promise.all([
      prisma.nutritionPlan.findFirst({
        where: { clientId: userId, active: true },
        include: {
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
          supplements: true,
        },
      }),
      prisma.workoutPlan.findFirst({
        where: { clientId: userId, active: true },
        include: {
          schedule: {
            include: {
              workout: {
                include: {
                  warmups: { orderBy: { orderIndex: "asc" } },
                  exercises: { orderBy: { orderIndex: "asc" } },
                },
              },
            },
            orderBy: { dayOfWeek: "asc" },
          },
        },
      }),
      prisma.waterLog.findMany({
        where: { userId, date: { gte: monday, lt: sunday } },
      }),
      prisma.supplementLog.findMany({
        where: { userId, date: { gte: monday, lt: sunday } },
      }),
      prisma.workoutLog.findMany({
        where: { userId, date: { gte: monday, lt: sunday } },
      }),
    ]);

  const DAY_NAMES = [
    "Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota", "Nedelja",
  ];

  const days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateStr = date.toLocaleDateString("sr-Latn-RS", {
      day: "2-digit",
      month: "2-digit",
    });

    const scheduleEntry = workoutPlan?.schedule.find((s) => s.dayOfWeek === i);
    const isTrainingDay = scheduleEntry?.type === "training";

    const meals =
      nutritionPlan?.meals.filter((m) => m.isTrainingDay === isTrainingDay) ?? [];

    // Check logs for this day
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayStr = dayStart.toDateString();

    const dayWater = waterLogs
      .filter((l) => new Date(l.date).toDateString() === dayStr)
      .reduce((sum, l) => sum + l.amountMl, 0);

    const daySupplements = supplementLogs.filter(
      (l) => new Date(l.date).toDateString() === dayStr && l.taken
    ).length;

    const dayWorkout = workoutLogs.find(
      (l) => new Date(l.date).toDateString() === dayStr && l.completed
    );

    return {
      date: dayStart.toISOString(),
      dateStr,
      dayName: DAY_NAMES[i],
      dayOfWeek: i,
      isTrainingDay,
      workout: scheduleEntry?.workout
        ? {
            name: scheduleEntry.workout.name,
            focus: scheduleEntry.workout.focus,
            warmups: scheduleEntry.workout.warmups.map((w) => ({
              name: w.name,
              videoUrl: w.videoUrl,
            })),
            exercises: scheduleEntry.workout.exercises.map((e) => ({
              exerciseId: e.exerciseId,
              name: e.name,
              sets: e.sets,
              note: e.note,
              videoUrl: e.videoUrl,
            })),
          }
        : null,
      label: scheduleEntry?.label ?? (isTrainingDay ? "Trening" : "Odmor"),
      restNotes: scheduleEntry?.restNotes ?? null,
      meals: meals.map((m) => ({
        id: m.id,
        name: m.name,
        time: m.time,
        protein: m.protein,
        carbs: m.carbs,
        fat: m.fat,
        icon: m.icon,
        options: m.options.map((o: any) => ({
          optionNumber: o.optionNumber,
          description: o.description,
          items: o.items?.map((item: any) => ({
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
      })),
      status: {
        water: dayWater >= 3000,
        waterMl: dayWater,
        supplements: daySupplements > 0,
        supplementCount: daySupplements,
        supplementTotal: nutritionPlan?.supplements.length ?? 0,
        workout: isTrainingDay ? (!!dayWorkout) : null,
      },
    };
  });

  return {
    days,
    weekStart: monday.toISOString(),
    weekOffset,
  };
}
