import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";

type Ctx = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { titre, contenu, couleur } = await request.json();

  const [updated] = await db
    .update(notes)
    .set({ titre, contenu, couleur, updatedAt: new Date() })
    .where(and(eq(notes.id, id), eq(notes.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({
    id: updated.id,
    titre: updated.titre,
    contenu: updated.contenu,
    couleur: updated.couleur,
    updatedAt: updated.updatedAt?.toISOString() ?? new Date().toISOString(),
  });
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, session.user.id)));
  return NextResponse.json({ ok: true });
}
