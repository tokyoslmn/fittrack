import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const addClientSchema = z.object({
  clientEmail: z.string().email(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "TRAINER") {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { clientEmail } = addClientSchema.parse(body);

    const client = await prisma.user.findUnique({
      where: { email: clientEmail },
    });

    if (!client || client.role !== "CLIENT") {
      return NextResponse.json(
        { error: "Klijent sa tim emailom nije pronađen" },
        { status: 404 }
      );
    }

    const existing = await prisma.trainerClient.findUnique({
      where: {
        trainerId_clientId: {
          trainerId: session.user.id,
          clientId: client.id,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Klijent je već dodat" },
        { status: 400 }
      );
    }

    await prisma.trainerClient.create({
      data: {
        trainerId: session.user.id,
        clientId: client.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Nevalidan email" }, { status: 400 });
    }
    return NextResponse.json({ error: "Greška na serveru" }, { status: 500 });
  }
}
