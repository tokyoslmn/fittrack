import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const mealSchema = z.object({
  mealName: z.string().min(1),
  description: z.string().min(1),
  time: z.string().optional(),
  onPlan: z.boolean().default(true),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = mealSchema.parse(body);

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const log = await prisma.mealLog.create({
      data: {
        userId: session.user.id,
        date: todayStart,
        mealName: data.mealName,
        description: data.description,
        time: data.time ?? now.toTimeString().slice(0, 5),
        onPlan: data.onPlan,
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
