import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { coursParticuliers } from "@/lib/db/schema";

type Ctx = { params: Promise<{ id: string }> };

function parse(row: typeof coursParticuliers.$inferSelect) {
  return {
    ...row,
    matieres: JSON.parse(row.matieres),
    jours: JSON.parse(row.jours),
    cycles: JSON.parse(row.cycles),
  };
}

export async function PUT(request: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { nom, matieres, montant, devise, seancesParCycle, jours, dateDebut, cycles } = body;

  const [updated] = await db
    .update(coursParticuliers)
    .set({
      nom,
      matieres: JSON.stringify(matieres ?? []),
      montant,
      devise,
      seancesParCycle,
      jours: JSON.stringify(jours ?? []),
      dateDebut,
      cycles: JSON.stringify(cycles ?? []),
    })
    .where(and(eq(coursParticuliers.id, id), eq(coursParticuliers.userId, session.user.id)))
    .returning();

  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(parse(updated));
}

export async function DELETE(_request: Request, { params }: Ctx) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  await db
    .delete(coursParticuliers)
    .where(and(eq(coursParticuliers.id, id), eq(coursParticuliers.userId, session.user.id)));

  return NextResponse.json({ ok: true });
}
