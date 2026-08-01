import sharp from "sharp";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
mkdirSync(publicDir, { recursive: true });

const BG = { r: 139, g: 92, b: 246 }; // #8b5cf6

async function genIcon(size, filename) {
  // Create solid purple square
  const base = await sharp({
    create: { width: size, height: size, channels: 4, background: { ...BG, alpha: 1 } },
  })
    .png()
    .toBuffer();

  // Overlay SVG with cat emoji centered
  const fontSize = Math.round(size * 0.52);
  const svg = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
       <text x="${size / 2}" y="${Math.round(size * 0.68)}"
             font-size="${fontSize}" text-anchor="middle"
             font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif">🐱</text>
     </svg>`
  );

  await sharp(base)
    .composite([{ input: svg, blend: "over" }])
    .png()
    .toFile(join(publicDir, filename));

  console.log(`✓ ${filename} (${size}×${size})`);
}

await genIcon(192, "icon-192.png");
await genIcon(512, "icon-512.png");
