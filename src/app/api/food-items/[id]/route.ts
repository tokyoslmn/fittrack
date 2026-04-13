import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const foodItemUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.string().nullable().optional(),
  defaultGrams: z.number().positive().optional(),
  defaultPieces: z.number().positive().nullable().optional(),
  protein: z.number().min(0).optional(),
  carbs: z.number().min(0).optional(),
  fat: z.number().min(0).optional(),
  calories: z.number().min(0).optional(),
  measuredRaw: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body = await request.json();
    const data = foodItemUpdateSchema.parse(body);
    const item = await prisma.foodItem.update({ where: { id }, data });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const usageCount = await prisma.mealOptionItem.count({
      where: { foodItemId: id },
    });
    if (usageCount > 0) {
      return NextResponse.json(
        { error: "Namirnica se koristi u obroku i ne može se obrisati" },
        { status: 409 }
      );
    }
    await prisma.foodItem.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
