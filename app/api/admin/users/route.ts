import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt })
    .from(users);

  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { name, email, password, role } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 12);

  const [created] = await db
    .insert(users)
    .values({ name, email, password: hashed, role: role ?? "user" })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt });

  return NextResponse.json(created, { status: 201 });
}
