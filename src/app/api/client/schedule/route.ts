import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getWeekSchedule } from "@/lib/queries/schedule";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Neautorizovan" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const offset = parseInt(searchParams.get("offset") ?? "0", 10);

  const data = await getWeekSchedule(session.user.id, offset);
  return NextResponse.json(data);
}
