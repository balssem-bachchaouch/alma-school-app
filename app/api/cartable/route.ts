import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { cartableItems } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(cartableItems)
    .where(eq(cartableItems.userId, session.user.id));

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, label, emoji, categorie } = body;

  if (!id || !label) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [created] = await db
    .insert(cartableItems)
    .values({
      id,
      userId: session.user.id,
      label,
      emoji: emoji || "📦",
      categorie: categorie || "École",
    })
    .returning();

  return NextResponse.json(created, { status: 201 });
}
