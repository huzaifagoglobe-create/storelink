import "server-only";
import { randomBytes, createHash } from "crypto";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";

const TTL_MS = 30 * 60 * 1000; // 30 minutes
const hashToken = (t: string) => createHash("sha256").update(t).digest("hex");

interface MockReset {
  userId: string;
  tokenHash: string;
  expiresAt: number;
  used: boolean;
}
const mockResets: MockReset[] = [];

/** Create a single-use, 30-min reset token. Returns the raw token for the link. */
export async function createPasswordReset(userId: string): Promise<string> {
  const token = randomBytes(32).toString("base64url"); // 256-bit, unguessable
  const tokenHash = hashToken(token);
  const expiresAt = Date.now() + TTL_MS;

  if (!isSupabaseConfigured()) {
    for (const r of mockResets) if (r.userId === userId && !r.used) r.used = true; // invalidate old
    mockResets.push({ userId, tokenHash, expiresAt, used: false });
    return token;
  }

  const supabase = getServerSupabase();
  await supabase
    .from("password_resets")
    .update({ used_at: new Date().toISOString() })
    .eq("user_id", userId)
    .is("used_at", null);
  const { error } = await supabase.from("password_resets").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: new Date(expiresAt).toISOString(),
  });
  if (error) {
    console.error("createPasswordReset:", error);
    throw new Error("Could not start the password reset.");
  }
  return token;
}

/** True if the token is currently valid (unused + unexpired). Does not consume it. */
export async function peekPasswordReset(token: string): Promise<boolean> {
  if (!token) return false;
  const tokenHash = hashToken(token);
  if (!isSupabaseConfigured()) {
    return mockResets.some((x) => x.tokenHash === tokenHash && !x.used && x.expiresAt > Date.now());
  }
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("password_resets")
    .select("expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!data || data.used_at) return false;
  return new Date(data.expires_at).getTime() > Date.now();
}

/** Validate + mark used. Returns the userId, or null if invalid/expired/used. */
export async function consumePasswordReset(token: string): Promise<string | null> {
  if (!token) return null;
  const tokenHash = hashToken(token);
  if (!isSupabaseConfigured()) {
    const r = mockResets.find((x) => x.tokenHash === tokenHash && !x.used && x.expiresAt > Date.now());
    if (!r) return null;
    r.used = true;
    return r.userId;
  }
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("password_resets")
    .select("id, user_id, expires_at, used_at")
    .eq("token_hash", tokenHash)
    .maybeSingle();
  if (!data || data.used_at || new Date(data.expires_at).getTime() <= Date.now()) return null;
  await supabase.from("password_resets").update({ used_at: new Date().toISOString() }).eq("id", data.id);
  return data.user_id;
}
