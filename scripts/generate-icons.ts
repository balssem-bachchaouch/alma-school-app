import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, "..", "public");

function buildSvg(size: number): string {
  const br = Math.round(size * 0.22); // border-radius ≈ 22%

  // All cat elements are designed for a 512×512 canvas, then scaled via viewBox
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#c4b5fd"/>
      <stop offset="100%" stop-color="#e879f9"/>
    </linearGradient>
    <clipPath id="roundRect">
      <rect width="512" height="512" rx="${Math.round(512 * 0.22)}" ry="${Math.round(512 * 0.22)}"/>
    </clipPath>
  </defs>

  <!-- Background -->
  <rect width="512" height="512" rx="${Math.round(512 * 0.22)}" ry="${Math.round(512 * 0.22)}" fill="url(#bg)"/>

  <!-- Ears (left) -->
  <polygon points="148,210 108,108 208,160" fill="#f9a8d4" stroke="white" stroke-width="6" stroke-linejoin="round"/>
  <!-- Inner ear (left) -->
  <polygon points="148,200 124,130 196,168" fill="#fce7f3"/>

  <!-- Ears (right) -->
  <polygon points="364,210 404,108 304,160" fill="#f9a8d4" stroke="white" stroke-width="6" stroke-linejoin="round"/>
  <!-- Inner ear (right) -->
  <polygon points="364,200 388,130 316,168" fill="#fce7f3"/>

  <!-- Face -->
  <ellipse cx="256" cy="300" rx="145" ry="135" fill="white"/>

  <!-- Left eye -->
  <ellipse cx="210" cy="275" rx="22" ry="25" fill="#7c3aed"/>
  <circle cx="220" cy="265" r="7" fill="white"/>

  <!-- Right eye -->
  <ellipse cx="302" cy="275" rx="22" ry="25" fill="#7c3aed"/>
  <circle cx="312" cy="265" r="7" fill="white"/>

  <!-- Nose -->
  <ellipse cx="256" cy="318" rx="12" ry="9" fill="#f9a8d4"/>

  <!-- Smile -->
  <path d="M230,334 Q256,358 282,334" fill="none" stroke="#f9a8d4" stroke-width="6" stroke-linecap="round"/>

  <!-- Cheeks -->
  <ellipse cx="180" cy="320" rx="34" ry="20" fill="#f9a8d4" fill-opacity="0.35"/>
  <ellipse cx="332" cy="320" rx="34" ry="20" fill="#f9a8d4" fill-opacity="0.35"/>

  <!-- Whiskers left -->
  <line x1="100" y1="308" x2="215" y2="320" stroke="#c4b5fd" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="100" y1="324" x2="215" y2="328" stroke="#c4b5fd" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="100" y1="340" x2="215" y2="336" stroke="#c4b5fd" stroke-width="3.5" stroke-linecap="round"/>

  <!-- Whiskers right -->
  <line x1="412" y1="308" x2="297" y2="320" stroke="#c4b5fd" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="412" y1="324" x2="297" y2="328" stroke="#c4b5fd" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="412" y1="340" x2="297" y2="336" stroke="#c4b5fd" stroke-width="3.5" stroke-linecap="round"/>

  <!-- Sparkle top-right ✨ -->
  <g transform="translate(390,90)">
    <line x1="0" y1="-22" x2="0" y2="22" stroke="white" stroke-width="4" stroke-linecap="round"/>
    <line x1="-22" y1="0" x2="22" y2="0" stroke="white" stroke-width="4" stroke-linecap="round"/>
    <line x1="-14" y1="-14" x2="14" y2="14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="14" y1="-14" x2="-14" y2="14" stroke="white" stroke-width="2.5" stroke-linecap="round"/>
    <circle cx="0" cy="0" r="5" fill="white"/>
  </g>
</svg>`;
}

async function generate(svgStr: string, outPath: string, size: number) {
  await sharp(Buffer.from(svgStr))
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath} (${size}×${size})`);
}

(async () => {
  const svg512 = buildSvg(512);
  await generate(svg512, path.join(publicDir, "icon-512.png"), 512);
  await generate(svg512, path.join(publicDir, "icon-192.png"), 192);
  await generate(svg512, path.join(publicDir, "apple-touch-icon.png"), 180);
  console.log("Done.");
})();
