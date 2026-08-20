import { db } from "../lib/db";
import { users } from "../lib/db/schema";
import { eq } from "drizzle-orm";

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/make-admin.ts <email>");
  process.exit(1);
}

const [updated] = await db
  .update(users)
  .set({ role: "admin" })
  .where(eq(users.email, email))
  .returning({ email: users.email });

if (!updated) {
  console.error(`User not found: ${email}`);
  process.exit(1);
}

console.log(`✅ ${updated.email} is now admin`);
process.exit(0);
