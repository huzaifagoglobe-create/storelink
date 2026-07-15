import "server-only";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE = "wsb_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days (seconds)
const MAX_AGE_MS = MAX_AGE * 1000;

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s) return s;
  // Fail closed in production: never sign sessions with the public default.
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "SESSION_SECRET is not set. Set a long, random SESSION_SECRET before running in production."
    );
  }
  // Dev/demo only — keeps `npm run dev` working with zero setup.
  return "dev-only-insecure-secret-change-me";
}

function sign(value: string): string {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

export interface SessionMeta {
  uid: string;
  iat: number; // issued-at (ms)
}

function makeToken(uid: string): string {
  const payload = Buffer.from(JSON.stringify({ uid, iat: Date.now() })).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function readToken(token: string): SessionMeta | null {
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null; // tampered
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
    const uid = typeof parsed.uid === "string" ? parsed.uid : null;
    const iat = typeof parsed.iat === "number" ? parsed.iat : 0;
    if (!uid) return null;
    // Enforce server-side expiry: a stolen cookie must not live forever.
    if (!iat || Date.now() - iat > MAX_AGE_MS) return null;
    return { uid, iat };
  } catch {
    return null;
  }
}

/** Set the login cookie. Call only from a Server Action or Route Handler. */
export async function setSessionCookie(uid: string): Promise<void> {
  (await cookies()).set(COOKIE, makeToken(uid), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie(): Promise<void> {
  (await cookies()).delete(COOKIE);
}

/** Read the logged-in user id (or null). Safe in Server Components. */
export async function getSessionUid(): Promise<string | null> {
  const meta = await getSession();
  return meta ? meta.uid : null;
}

/** Read the full session metadata (uid + issued-at), or null. */
export async function getSession(): Promise<SessionMeta | null> {
  const c = (await cookies()).get(COOKIE);
  return c ? readToken(c.value) : null;
}
