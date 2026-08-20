import { NextResponse } from "next/server";
import { and, eq, ne } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, role } = body;

  const [updated] = await db
    .update(users)
    .set({ ...(name ? { name } : {}), ...(role ? { role } : {}) })
    .where(eq(users.id, id))
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role });

  if (!updated) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  if (id === session.user.id) {
    return NextResponse.json({ error: "Cannot delete own account" }, { status: 400 });
  }

  await db.delete(users).where(and(eq(users.id, id), ne(users.id, session.user.id)));

  return NextResponse.json({ ok: true });
}
