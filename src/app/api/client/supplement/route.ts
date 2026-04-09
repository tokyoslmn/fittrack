import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const supplementSchema = z.object({
  supplementName: z.string().min(1),
  taken: z.boolean(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { supplementName, taken } = supplementSchema.parse(body);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Upsert: find existing log for this supplement today, or create new
    const existing = await prisma.supplementLog.findFirst({
      where: {
        userId: session.user.id,
        date: todayStart,
        supplementName,
      },
    });

    let log;
    if (existing) {
      log = await prisma.supplementLog.update({
        where: { id: existing.id },
        data: { taken },
      });
    } else {
      log = await prisma.supplementLog.create({
        data: {
          userId: session.user.id,
          date: todayStart,
          supplementName,
          taken,
        },
      });
    }

    return NextResponse.json(log);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
