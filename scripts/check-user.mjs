import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const dir = dirname(fileURLToPath(import.meta.url));

// Load .env.local
readFileSync(join(dir, "../.env.local"), "utf8")
  .split("\n")
  .forEach((line) => {
    const [k, ...v] = line.split("=");
    if (k && !k.startsWith("#") && k.trim()) {
      process.env[k.trim()] = v.join("=").trim();
    }
  });

const { neon } = await import("@neondatabase/serverless");
const { compare } = await import("bcryptjs");

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`SELECT id, name, email, password FROM users WHERE email = 'alma@test.com'`;

if (rows.length === 0) {
  console.log("USER NOT FOUND in database");
} else {
  const user = rows[0];
  console.log("Found user:", { id: user.id, name: user.name, email: user.email });
  console.log("Password hash prefix:", user.password.slice(0, 7));
  const match = await compare("ALMA2024", user.password);
  console.log("bcrypt.compare('ALMA2024', hash):", match);
}
