import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { planningSlots } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(planningSlots)
    .where(eq(planningSlots.userId, session.user.id))
    .orderBy(asc(planningSlots.day), asc(planningSlots.startTime));

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { titre, categorie, day, startTime, endTime, colorClass } = body;

  if (!titre || !categorie || day === undefined || !startTime || !endTime || !colorClass) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [created] = await db
    .insert(planningSlots)
    .values({
      userId: session.user.id,
      titre,
      categorie,
      day,
      startTime,
      endTime,
      colorClass,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
