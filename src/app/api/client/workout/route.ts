import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const exerciseLogSchema = z.object({
  exerciseId: z.string(),
  completed: z.boolean(),
  weight: z.number().optional(),
  reps: z.string().optional(),
  notes: z.string().optional(),
});

const workoutSchema = z.object({
  workoutId: z.string(),
  duration: z.number().int().optional(),
  notes: z.string().optional(),
  exerciseLogs: z.array(exerciseLogSchema),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = workoutSchema.parse(body);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const log = await prisma.workoutLog.create({
      data: {
        userId: session.user.id,
        date: todayStart,
        workoutId: data.workoutId,
        completed: true,
        duration: data.duration,
        notes: data.notes,
        exerciseLogs: {
          create: data.exerciseLogs.map((e) => ({
            exerciseId: e.exerciseId,
            completed: e.completed,
            weight: e.weight,
            reps: e.reps,
            notes: e.notes,
          })),
        },
      },
      include: { exerciseLogs: true },
    });

    return NextResponse.json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
