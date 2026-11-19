import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const items = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, session.user.id))
    .orderBy(desc(notes.updatedAt));

  return NextResponse.json(items.map(n => ({
    id: n.id,
    titre: n.titre,
    contenu: n.contenu,
    couleur: n.couleur,
    updatedAt: n.updatedAt?.toISOString() ?? new Date().toISOString(),
  })));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { titre, contenu, couleur } = await request.json();
  if (!titre) return NextResponse.json({ error: "Missing titre" }, { status: 400 });

  const [created] = await db
    .insert(notes)
    .values({ userId: session.user.id, titre, contenu: contenu ?? "", couleur: couleur ?? "#ffffff" })
    .returning();

  return NextResponse.json({
    id: created.id,
    titre: created.titre,
    contenu: created.contenu,
    couleur: created.couleur,
    updatedAt: created.updatedAt?.toISOString() ?? new Date().toISOString(),
  }, { status: 201 });
}
