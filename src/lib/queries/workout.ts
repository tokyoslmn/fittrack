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
