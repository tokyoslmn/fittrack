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
