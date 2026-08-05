import { config } from "dotenv";
import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });

const EMAIL = "balssembachchaouch12@gmail.com";
const NEW_PASSWORD = "2508Almoucha";

async function main() {
  const sql = neon(process.env.DATABASE_URL!);

  const rows = await sql`SELECT id FROM users WHERE email = ${EMAIL}`;
  if (rows.length === 0) {
    console.error(`❌ No user found with email: ${EMAIL}`);
    process.exit(1);
  }

  const hashed = await bcrypt.hash(NEW_PASSWORD, 10);
  await sql`UPDATE users SET password = ${hashed} WHERE email = ${EMAIL}`;

  console.log(`✅ Password updated for ${EMAIL}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
