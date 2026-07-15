import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { sendEmail } from "../email";
import { SITE_URL } from "@/lib/site";

const TTL_MS = 24 * 60 * 60 * 1000; // 24h

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  if (process.env.NODE_ENV === "production") throw new Error("SESSION_SECRET is required.");
  return "dev-only-insecure-secret-change-me";
}
function sign(v: string): string {
  return createHmac("sha256", secret()).update(v).digest("base64url");
}

export function makeEmailToken(uid: string): string {
  const payload = Buffer.from(JSON.stringify({ uid, exp: Date.now() + TTL_MS })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}
export function readEmailToken(token: string): string | null {
  const [payload, sig] = (token || "").split(".");
  if (!payload || !sig) return null;
  const a = Buffer.from(sig), b = Buffer.from(sign(payload));
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const { uid, exp } = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof uid !== "string" || typeof exp !== "number" || Date.now() > exp) return null;
    return uid;
  } catch { return null; }
}

export async function sendVerificationEmail(userId: string, email: string): Promise<void> {
  try {
    const link = `${SITE_URL}/verify-email?token=${encodeURIComponent(makeEmailToken(userId))}`;
    await sendEmail({
      to: email,
      subject: "Verify your StoreLink email",
      text: `Welcome to StoreLink!\n\nConfirm your email to secure your account:\n${link}\n\nThis link expires in 24 hours.`,
    });
  } catch (e) {
    console.error("sendVerificationEmail:", e);
  }
}
