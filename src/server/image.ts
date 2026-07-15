import sharp from "sharp";

/**
 * Identify an image by its file signature (magic bytes), NOT the client-sent
 * MIME type (which is trivially spoofable). Returns the real content type, or
 * null if the bytes are not one of our allowed image formats.
 */
export function sniffImageType(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47 &&
    buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a
  ) return "image/png";
  // GIF: "GIF8"
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) return "image/gif";
  // WEBP: "RIFF"...."WEBP"
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) return "image/webp";
  return null;
}

/**
 * Convert an uploaded image to WebP. Re-encoding through sharp also neutralises
 * any non-image payload hidden behind an image extension. If the bytes are not
 * a decodable image, this THROWS — we never store unverified bytes.
 *  - Downscales to fit within MAX_DIM on the longest side (never upscales), so a
 *    huge phone photo isn't served full-size — big win for load speed / LCP.
 *  - Respects EXIF orientation; PNG/GIF -> lossless WebP; JPEG/WebP -> quality 92;
 *    GIF stays animated.
 *  - Caps decoded pixels to reject "decompression bomb" images (tiny file that
 *    expands to a giant bitmap and exhausts memory).
 */
const MAX_DIM = 1600; // px, longest side
const MAX_INPUT_PIXELS = 50_000_000; // ~7000x7000; rejects decompression bombs

export async function toWebp(
  buf: Buffer,
  contentType: string
): Promise<{ buf: Buffer; contentType: string }> {
  const animated = contentType === "image/gif";
  const lossless = contentType === "image/png" || contentType === "image/gif";
  const out = await sharp(buf, {
    limitInputPixels: MAX_INPUT_PIXELS,
    ...(animated ? { animated: true } : {}),
  })
    .rotate()
    .resize(MAX_DIM, MAX_DIM, { fit: "inside", withoutEnlargement: true })
    .webp(lossless ? { lossless: true } : { quality: 82 })
    .toBuffer();
  if (!out || out.length === 0) throw new Error("Image could not be processed.");
  return { buf: out, contentType: "image/webp" };
}
