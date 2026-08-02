import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { planningSlots } from "@/lib/db/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { titre, categorie, day, startTime, endTime, colorClass } = body;

  const [updated] = await db
    .update(planningSlots)
    .set({ titre, categorie, day, startTime, endTime, colorClass })
    .where(and(eq(planningSlots.id, id), eq(planningSlots.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db
    .delete(planningSlots)
    .where(and(eq(planningSlots.id, id), eq(planningSlots.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
