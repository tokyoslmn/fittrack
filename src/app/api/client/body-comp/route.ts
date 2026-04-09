import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bodyCompSchema = z.object({
  weight: z.number().positive().optional(),
  bodyFatPct: z.number().min(0).max(100).optional(),
  fatMass: z.number().positive().optional(),
  muscleMass: z.number().positive().optional(),
  musclePct: z.number().min(0).max(100).optional(),
  skeletalMuscle: z.number().positive().optional(),
  bodyWater: z.number().min(0).max(100).optional(),
  visceralFat: z.number().min(0).optional(),
  bmr: z.number().int().positive().optional(),
  bmi: z.number().positive().optional(),
  waistHip: z.number().positive().optional(),
  heartRate: z.number().int().positive().optional(),
  note: z.string().optional(),
  date: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = bodyCompSchema.parse(body);

    const logDate = data.date ? new Date(data.date) : new Date();
    const dateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());

    const log = await prisma.bodyCompositionLog.create({
      data: {
        userId: session.user.id,
        date: dateOnly,
        weight: data.weight,
        bodyFatPct: data.bodyFatPct,
        fatMass: data.fatMass,
        muscleMass: data.muscleMass,
        musclePct: data.musclePct,
        skeletalMuscle: data.skeletalMuscle,
        bodyWater: data.bodyWater,
        visceralFat: data.visceralFat,
        bmr: data.bmr,
        bmi: data.bmi,
        waistHip: data.waistHip,
        heartRate: data.heartRate,
        note: data.note || null,
      },
    });

    return NextResponse.json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
