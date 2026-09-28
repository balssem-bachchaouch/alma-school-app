import { NextResponse } from "next/server";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tachesPerso } from "@/lib/db/schema";
import type { Tache, SousTache } from "@/lib/types";

function parseRow(row: typeof tachesPerso.$inferSelect): Tache {
  return {
    id: row.id,
    titre: row.titre,
    description: row.description ?? undefined,
    statut: row.statut,
    priorite: row.priorite,
    type: row.type,
    dueDate: row.dueDate ?? undefined,
    sousTaches: (() => {
      try { return JSON.parse(row.sousTaches) as SousTache[]; } catch { return []; }
    })(),
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { titre, description, statut, priorite, type, dueDate, sousTaches } = body;

  const [row] = await db
    .update(tachesPerso)
    .set({
      titre,
      description: description || null,
      statut,
      priorite,
      type,
      dueDate: dueDate || null,
      sousTaches: JSON.stringify(sousTaches ?? []),
    })
    .where(and(eq(tachesPerso.id, id), eq(tachesPerso.userId, session.user.id)))
    .returning();

  if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(parseRow(row));
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db
    .delete(tachesPerso)
    .where(and(eq(tachesPerso.id, id), eq(tachesPerso.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
