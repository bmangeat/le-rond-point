// Génère les splash screens iOS (apple-touch-startup-image) à partir du logo.
// Logo centré sur fond #F8FAFF, aux résolutions des iPhones courants (portrait).
// Usage : node scripts/gen-splash.mjs
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(root, "public/icons/icon-512.png");
const OUT = join(root, "public/splash");
const BG = { r: 248, g: 250, b: 255, alpha: 1 }; // #F8FAFF

// [largeur CSS, hauteur CSS, device-pixel-ratio] en portrait
const DEVICES = [
  [320, 568, 2], [375, 667, 2], [414, 736, 3], [375, 812, 3],
  [414, 896, 2], [414, 896, 3], [390, 844, 3], [428, 926, 3],
  [393, 852, 3], [430, 932, 3], [402, 874, 3], [440, 956, 3],
];

await mkdir(OUT, { recursive: true });

const tags = [];
for (const [cw, ch, dpr] of DEVICES) {
  const w = cw * dpr, h = ch * dpr;
  const logo = Math.round(Math.min(w, h) * 0.32); // logo = 32% du petit côté
  const resized = await sharp(SRC).resize(logo, logo, { fit: "contain" }).toBuffer();
  const file = `apple-splash-${w}x${h}.png`;
  await sharp({ create: { width: w, height: h, channels: 4, background: BG } })
    .composite([{ input: resized, gravity: "centre" }])
    .png()
    .toFile(join(OUT, file));
  tags.push({
    url: `/splash/${file}`,
    media: `(device-width: ${cw}px) and (device-height: ${ch}px) and (-webkit-device-pixel-ratio: ${dpr}) and (orientation: portrait)`,
  });
  console.log("✓", file);
}

// Écrit le tableau startupImage prêt à coller dans le layout.
await writeFile(join(OUT, "startup-images.json"), JSON.stringify(tags, null, 2));
console.log(`\n${tags.length} splash screens générées dans public/splash/`);
