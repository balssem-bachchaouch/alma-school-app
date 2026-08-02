import { NextResponse } from "next/server";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { devoirs } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(devoirs)
    .where(eq(devoirs.userId, session.user.id))
    .orderBy(asc(devoirs.dueDate));

  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { matiere, titre, dueDate, duree, description } = body;

  if (!matiere || !titre || !dueDate || !duree) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [created] = await db
    .insert(devoirs)
    .values({
      userId: session.user.id,
      matiere,
      titre,
      dueDate,
      duree,
      description: description ?? null,
      completed: false,
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
