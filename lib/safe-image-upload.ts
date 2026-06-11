import sharp from "sharp";

export type DetectedImageKind = "jpeg" | "png" | "webp";

const MAX_INPUT_BYTES = 12 * 1024 * 1024;

/** Magic-byte detection only (do not trust Content-Type). */
export function detectImageKind(buffer: Buffer): DetectedImageKind | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

function normalizeClientMime(blobType: string): "image/jpeg" | "image/png" | "image/webp" | null {
  const t = blobType.trim().toLowerCase();
  if (t === "image/jpeg" || t === "image/jpg") return "image/jpeg";
  if (t === "image/png") return "image/png";
  if (t === "image/webp") return "image/webp";
  return null;
}

export function mimeMatchesMagic(claimedBlobType: string, kind: DetectedImageKind): boolean {
  const m = normalizeClientMime(claimedBlobType);
  if (!m) return false;
  if (kind === "jpeg") return m === "image/jpeg";
  if (kind === "png") return m === "image/png";
  return m === "image/webp";
}

/**
 * Decode → auto-orient → strip metadata by re-encoding → WebP.
 * Rejects polyglot / truncated payloads via sharp failOn + decode errors.
 */
export async function sanitizeImageToWebp(input: Buffer): Promise<Buffer> {
  if (input.length > MAX_INPUT_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }
  const pipeline = sharp(input, {
    failOn: "error",
    limitInputPixels: 4096 * 4096,
    sequentialRead: true,
  })
    .rotate()
    // Никой публичен сайт не показва над ~1920px — по-големите само тежат.
    .resize({ width: 1920, height: 1920, fit: "inside", withoutEnlargement: true });

  return pipeline.webp({ quality: 82, effort: 4, smartSubsample: true }).toBuffer();
}

export type ProcessUploadImageResult =
  | { ok: true; buffer: Buffer; contentType: "image/webp"; extension: "webp" }
  | { ok: false; code: "BAD_FORMAT" | "MIME_MISMATCH" | "TRANSCODE_FAILED"; message: string };

/**
 * Full pipeline: magic bytes, MIME vs bytes, sharp re-encode to WebP.
 * Storage paths should stay `${salonSlug}/...` — combine with bucket RLS so tenant A cannot write under tenant B.
 */
export async function processAdminImageUpload(
  raw: Buffer,
  claimedBlobType: string,
): Promise<ProcessUploadImageResult> {
  const kind = detectImageKind(raw);
  if (!kind) {
    return { ok: false, code: "BAD_FORMAT", message: "Файлът не е валидно JPEG, PNG или WebP изображение." };
  }
  if (!mimeMatchesMagic(claimedBlobType, kind)) {
    return {
      ok: false,
      code: "MIME_MISMATCH",
      message: "Типът на файла (MIME) не съвпада с реалното съдържание. Качете отново изображението.",
    };
  }
  try {
    const buffer = await sanitizeImageToWebp(raw);
    if (buffer.length === 0) {
      return { ok: false, code: "TRANSCODE_FAILED", message: "Неуспешно обработване на изображението." };
    }
    return { ok: true, buffer, contentType: "image/webp", extension: "webp" };
  } catch {
    return { ok: false, code: "TRANSCODE_FAILED", message: "Неуспешно декодиране или прекодиране на изображението." };
  }
}
