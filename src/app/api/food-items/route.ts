import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const foodItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().nullable().optional(),
  defaultGrams: z.number().positive().default(100),
  defaultPieces: z.number().positive().nullable().optional(),
  protein: z.number().min(0),
  carbs: z.number().min(0),
  fat: z.number().min(0),
  calories: z.number().min(0),
  measuredRaw: z.boolean().default(true),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category");

  const where: Record<string, unknown> = {};
  if (search) {
    where.name = { contains: search, mode: "insensitive" };
  }
  if (category) {
    where.category = category;
  }

  const items = await prisma.foodItem.findMany({
    where,
    orderBy: [{ category: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const data = foodItemSchema.parse(body);
    const item = await prisma.foodItem.create({ data });
    return NextResponse.json(item);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidni podaci" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
