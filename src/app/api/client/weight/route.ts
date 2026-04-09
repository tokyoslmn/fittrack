import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const weightSchema = z.object({
  weight: z.number().positive().max(500),
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
    const { weight, note, date } = weightSchema.parse(body);

    const logDate = date ? new Date(date) : new Date();
    const dateOnly = new Date(logDate.getFullYear(), logDate.getMonth(), logDate.getDate());

    const log = await prisma.weightLog.create({
      data: {
        userId: session.user.id,
        date: dateOnly,
        weight,
        note: note || null,
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
