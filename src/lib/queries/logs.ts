import { prisma } from "@/lib/prisma";

export async function getWeightHistory(userId: string, limit = 30) {
  return prisma.weightLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getBodyCompHistory(userId: string, limit = 10) {
  return prisma.bodyCompositionLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: limit,
  });
}

export async function getTodayWaterLogs(userId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  return prisma.waterLog.findMany({
    where: { userId, date: { gte: todayStart, lt: todayEnd } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getTodayMealLogs(userId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  return prisma.mealLog.findMany({
    where: { userId, date: { gte: todayStart, lt: todayEnd } },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSupplementPlan(userId: string) {
  const plan = await prisma.nutritionPlan.findFirst({
    where: { clientId: userId, active: true },
    include: { supplements: true },
  });
  return plan?.supplements ?? [];
}

export async function getTodaySupplementLogs(userId: string) {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  return prisma.supplementLog.findMany({
    where: { userId, date: { gte: todayStart, lt: todayEnd } },
  });
}
