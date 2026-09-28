import { NextResponse } from "next/server";
import { desc, eq } from "drizzle-orm";
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

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await db
    .select()
    .from(tachesPerso)
    .where(eq(tachesPerso.userId, session.user.id))
    .orderBy(desc(tachesPerso.createdAt));

  return NextResponse.json(rows.map(parseRow));
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { titre, description, statut, priorite, type, dueDate, sousTaches } = body;

  if (!titre) return NextResponse.json({ error: "titre requis" }, { status: 400 });

  const id = crypto.randomUUID();
  const [row] = await db
    .insert(tachesPerso)
    .values({
      id,
      userId: session.user.id,
      titre,
      description: description || null,
      statut: statut ?? "À faire",
      priorite: priorite ?? "Moyenne",
      type: type ?? "Perso",
      dueDate: dueDate || null,
      sousTaches: JSON.stringify(sousTaches ?? []),
    })
    .returning();

  return NextResponse.json(parseRow(row), { status: 201 });
}
