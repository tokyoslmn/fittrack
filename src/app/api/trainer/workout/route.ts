import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const warmupSchema = z.object({
  name: z.string().min(1),
  videoUrl: z.string().optional(),
  orderIndex: z.number().int(),
});

const exerciseSchema = z.object({
  exerciseId: z.string().min(1),
  name: z.string().min(1),
  sets: z.string().min(1),
  note: z.string().optional(),
  videoUrl: z.string().optional(),
  orderIndex: z.number().int(),
});

const workoutSchema = z.object({
  name: z.string().min(1),
  focus: z.string().min(1),
  orderIndex: z.number().int(),
  warmups: z.array(warmupSchema),
  exercises: z.array(exerciseSchema),
});

const workoutPlanSchema = z.object({
  clientId: z.string(),
  name: z.string().min(1),
  notes: z.string().optional(),
  workouts: z.array(workoutSchema),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = workoutPlanSchema.parse(body);

    // Deactivate existing plans
    await prisma.workoutPlan.updateMany({
      where: { clientId: data.clientId, active: true },
      data: { active: false },
    });

    const plan = await prisma.workoutPlan.create({
      data: {
        trainerId: session.user.id,
        clientId: data.clientId,
        name: data.name,
        notes: data.notes,
        workouts: {
          create: data.workouts.map((w) => ({
            name: w.name,
            focus: w.focus,
            orderIndex: w.orderIndex,
            warmups: { create: w.warmups },
            exercises: { create: w.exercises },
          })),
        },
      },
      include: {
        workouts: {
          include: { warmups: true, exercises: true },
        },
      },
    });

    return NextResponse.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
