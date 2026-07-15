import "server-only";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "crypto";

// AES-256-GCM field encryption for sensitive values (CNIC number, payout
// account number). Format: enc:v1:<ivB64>:<tagB64>:<cipherB64>
// The key is derived from FIELD_ENCRYPTION_KEY, falling back to SESSION_SECRET
// (which is already required in production), so no new env var is mandatory.

const PREFIX = "enc:v1:";

function key(): Buffer {
  const material =
    process.env.FIELD_ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    (process.env.NODE_ENV !== "production" ? "dev-only-insecure-secret-change-me" : "");
  if (!material) {
    throw new Error("FIELD_ENCRYPTION_KEY or SESSION_SECRET must be set to encrypt sensitive fields.");
  }
  // Derive a stable 32-byte key from the secret.
  return scryptSync(material, "storelink-field-v1", 32);
}

/** Encrypt a value for storage. Empty/blank passes through unchanged. */
export function encryptField(plain: string | null | undefined): string | null {
  if (plain === null || plain === undefined || plain === "") return null;
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${PREFIX}${iv.toString("base64")}:${tag.toString("base64")}:${enc.toString("base64")}`;
}

/** Decrypt a stored value. Plain (legacy/demo) values are returned unchanged. */
export function decryptField(value: string | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (!value.startsWith(PREFIX)) return value; // not encrypted (legacy / demo)
  try {
    const [, , ivB64, tagB64, dataB64] = value.split(":");
    const iv = Buffer.from(ivB64, "base64");
    const tag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = createDecipheriv("aes-256-gcm", key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
  } catch (e) {
    console.error("decryptField failed:", e);
    return "••••";
  }
}
