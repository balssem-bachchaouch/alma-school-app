import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { coursParticuliers } from "@/lib/db/schema";

function parse(row: typeof coursParticuliers.$inferSelect) {
  return {
    ...row,
    matieres: JSON.parse(row.matieres),
    jours: JSON.parse(row.jours),
    cycles: JSON.parse(row.cycles),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await db
    .select()
    .from(coursParticuliers)
    .where(eq(coursParticuliers.userId, session.user.id));

  return NextResponse.json(rows.map(parse));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { id, nom, matieres, montant, devise, seancesParCycle, jours, dateDebut, cycles } = body;

  if (!id || !nom || !dateDebut) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const [created] = await db
    .insert(coursParticuliers)
    .values({
      id,
      userId: session.user.id,
      nom,
      matieres: JSON.stringify(matieres ?? []),
      montant: montant ?? 0,
      devise: devise ?? "DT",
      seancesParCycle: seancesParCycle ?? 12,
      jours: JSON.stringify(jours ?? []),
      dateDebut,
      cycles: JSON.stringify(cycles ?? []),
    })
    .returning();

  return NextResponse.json(parse(created), { status: 201 });
}
