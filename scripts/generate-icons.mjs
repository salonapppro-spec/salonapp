import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const inputPath = path.join(process.cwd(), "assets", "logo.png");
const outDir = path.join(process.cwd(), "public", "icons");

await fs.mkdir(outDir, { recursive: true });

const img = sharp(inputPath);
const meta = await img.metadata();

if (!meta.width || !meta.height) {
  throw new Error("Could not read image metadata");
}

// Crop a square around the monogram area (top-center).
// This is tuned for the provided banner logo.
const cropSize = Math.min(meta.width, Math.round(meta.height * 0.78));
const left = Math.max(0, Math.round((meta.width - cropSize) / 2));
const top = Math.max(0, Math.round(meta.height * 0.06));

const base = sharp(inputPath).extract({
  left,
  top,
  width: cropSize,
  height: cropSize,
});

const sizes = [
  { name: "icon-16.png", size: 16 },
  { name: "icon-32.png", size: 32 },
  { name: "icon-48.png", size: 48 },
  { name: "icon-64.png", size: 64 },
  { name: "icon-180.png", size: 180 }, // apple-touch-icon
  { name: "icon-192.png", size: 192 }, // PWA
  { name: "icon-512.png", size: 512 }, // PWA
];

await Promise.all(
  sizes.map(async ({ name, size }) => {
    await base
      .clone()
      .resize(size, size, { fit: "cover" })
      .png({ compressionLevel: 9 })
      .toFile(path.join(outDir, name));
  })
);

console.log(
  JSON.stringify(
    {
      input: { width: meta.width, height: meta.height },
      crop: { left, top, size: cropSize },
      outputDir: "public/icons",
      files: sizes.map((s) => s.name),
    },
    null,
    2
  )
);

