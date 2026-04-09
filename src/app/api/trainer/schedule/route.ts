import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const daySchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  dayName: z.string(),
  type: z.enum(["training", "rest"]),
  workoutId: z.string().nullable(),
  label: z.string(),
  restNotes: z.string().nullable().optional(),
});

const scheduleSchema = z.object({
  planId: z.string(),
  days: z.array(daySchema).length(7),
});

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = scheduleSchema.parse(body);

    // Delete existing schedule and recreate
    await prisma.weeklySchedule.deleteMany({
      where: { planId: data.planId },
    });

    const entries = await Promise.all(
      data.days.map((day) =>
        prisma.weeklySchedule.create({
          data: {
            planId: data.planId,
            ...day,
          },
        })
      )
    );

    return NextResponse.json(entries);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
