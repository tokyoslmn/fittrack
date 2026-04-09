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
    currentWeight: r.client.weightLogs[0]?.weight ?? null,
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
