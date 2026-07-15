import "server-only";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import { hashPassword } from "./password";
import type { AppUser, UserRole } from "../types";

// ---- demo users (in memory; only used when Supabase is NOT configured) ----
interface MockUser extends AppUser {
  passwordHash: string;
}
// Pinned to globalThis so every route bundle shares ONE user store. Without
// this, an account created by the signup route isn't visible to the auth
// lookup in other routes (each production bundle gets its own module copy),
// which silently bounced brand-new sellers back to /login.
const ug = globalThis as unknown as { __wsbUsers?: MockUser[] };
ug.__wsbUsers ??= [];
const mockUsers: MockUser[] = ug.__wsbUsers;

function seedDemoUser(): void {
  if (mockUsers.length > 0) return;
  mockUsers.push({
    id: "user-demo",
    email: "demo@shop.pk",
    fullName: "Zara (Demo)",
    shopId: "shop-zara",
    role: "seller",
    createdAt: new Date().toISOString(),
    sessionsValidFrom: 0,
    emailVerifiedAt: new Date().toISOString(),
    passwordHash: hashPassword("1234"),
  });
  mockUsers.push({
    id: "user-admin",
    email: "admin@shop.pk",
    fullName: "Platform Admin",
    shopId: null,
    role: "admin",
    createdAt: new Date().toISOString(),
    sessionsValidFrom: 0,
    emailVerifiedAt: new Date().toISOString(),
    passwordHash: hashPassword("4321"),
  });
}
seedDemoUser();

const stripHash = (u: MockUser): AppUser => {
  const { passwordHash, ...rest } = u;
  return rest;
};

function rowToAppUser(r: any): AppUser {
  return {
    id: r.id,
    email: r.email,
    fullName: r.full_name ?? null,
    shopId: r.shop_id ?? null,
    role: r.role,
    createdAt: r.created_at,
    sessionsValidFrom: r.sessions_valid_from ? new Date(r.sessions_valid_from).getTime() : 0,
    emailVerifiedAt: r.email_verified_at ?? null,
  };
}

export async function findUserForLogin(
  email: string
): Promise<{ user: AppUser; passwordHash: string } | null> {
  const e = email.trim().toLowerCase();
  if (!isSupabaseConfigured()) {
    seedDemoUser();
    const m = mockUsers.find((u) => u.email.toLowerCase() === e);
    return m ? { user: stripHash(m), passwordHash: m.passwordHash } : null;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .eq("email", e)
    .maybeSingle();
  if (error || !data) return null;
  return { user: rowToAppUser(data), passwordHash: data.password_hash };
}

export async function getUserById(id: string): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) {
    seedDemoUser();
    const m = mockUsers.find((u) => u.id === id);
    return m ? stripHash(m) : null;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return rowToAppUser(data);
}

export async function createUser(input: {
  email: string;
  password: string;
  fullName?: string | null;
  shopId: string | null;
  role?: UserRole;
}): Promise<AppUser> {
  const email = input.email.trim().toLowerCase();
  const passwordHash = hashPassword(input.password);

  if (!isSupabaseConfigured()) {
    seedDemoUser();
    if (mockUsers.some((u) => u.email.toLowerCase() === email)) {
      throw new Error("An account with this email already exists.");
    }
    const user: MockUser = {
      id: `user-${Date.now()}`,
      email,
      fullName: input.fullName ?? null,
      shopId: input.shopId,
      role: input.role ?? "seller",
      createdAt: new Date().toISOString(),
      sessionsValidFrom: 0,
      emailVerifiedAt: null,
      passwordHash,
    };
    mockUsers.push(user);
    return stripHash(user);
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("app_users")
    .insert({
      email,
      password_hash: passwordHash,
      full_name: input.fullName ?? null,
      shop_id: input.shopId,
      role: input.role ?? "seller",
    })
    .select("*")
    .single();
  if (error || !data) {
    if ((error as any)?.code === "23505") {
      throw new Error("An account with this email already exists.");
    }
    console.error("createUser:", error);
    throw new Error("Could not create the account. Please try again.");
  }
  return rowToAppUser(data);
}

/** Link a freshly created shop to a user (used right after sign-up). */
export async function setUserShop(userId: string, shopId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const m = mockUsers.find((u) => u.id === userId);
    if (m) m.shopId = shopId;
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase.from("app_users").update({ shop_id: shopId }).eq("id", userId);
  if (error) console.error("setUserShop:", error);
}

/** Replace a user's PIN (used by the password-reset flow). */
export async function setUserPassword(userId: string, newPassword: string): Promise<void> {
  const passwordHash = hashPassword(newPassword);
  const now = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    seedDemoUser();
    const m = mockUsers.find((u) => u.id === userId);
    if (m) {
      m.passwordHash = passwordHash;
      m.sessionsValidFrom = Date.now(); // log out existing sessions
    }
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase
    .from("app_users")
    .update({ password_hash: passwordHash, sessions_valid_from: now })
    .eq("id", userId);
  if (error) {
    console.error("setUserPassword:", error);
    throw new Error("Could not update your PIN. Please try again.");
  }
}

/** Email of the seller who owns a shop (for order notifications). */
export async function getOwnerEmailByShopId(shopId: string): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    seedDemoUser();
    return mockUsers.find((u) => u.shopId === shopId)?.email ?? null;
  }
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("app_users")
    .select("email")
    .eq("shop_id", shopId)
    .limit(1)
    .maybeSingle();
  return data?.email ?? null;
}

/** Permanently delete a user account. */
export async function deleteUser(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const i = mockUsers.findIndex((u) => u.id === userId);
    if (i >= 0) mockUsers.splice(i, 1);
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase.from("app_users").delete().eq("id", userId);
  if (error) console.error("deleteUser:", error.message);
}

/** Mark a user's email as verified. */
export async function setEmailVerified(userId: string): Promise<void> {
  const now = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    seedDemoUser();
    const m = mockUsers.find((u) => u.id === userId);
    if (m) m.emailVerifiedAt = now;
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("app_users").update({ email_verified_at: now }).eq("id", userId);
}

/** All staff logins for a shop (role "staff"). */
export async function listStaffByShop(shopId: string): Promise<AppUser[]> {
  if (!isSupabaseConfigured()) {
    seedDemoUser();
    return mockUsers.filter((u) => u.shopId === shopId && u.role === "staff").map(stripHash);
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("app_users")
    .select("*")
    .eq("shop_id", shopId)
    .eq("role", "staff")
    .order("created_at", { ascending: true });
  if (error) {
    console.error("listStaffByShop:", error.message);
    return [];
  }
  return (data ?? []).map(rowToAppUser);
}

/** Remove a staff login (owner action). Only deletes role-"staff" users. */
export async function deleteStaffUser(shopId: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const i = mockUsers.findIndex((u) => u.id === userId && u.shopId === shopId && u.role === "staff");
    if (i >= 0) mockUsers.splice(i, 1);
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("app_users").delete().eq("id", userId).eq("shop_id", shopId).eq("role", "staff");
}

/** The owner (role "seller") account for a shop, or null. */
export async function getOwnerByShopId(shopId: string): Promise<AppUser | null> {
  if (!isSupabaseConfigured()) {
    seedDemoUser();
    const u = mockUsers.find((x) => x.shopId === shopId && x.role === "seller");
    return u ? stripHash(u) : null;
  }
  const supabase = getServerSupabase();
  const { data } = await supabase
    .from("app_users")
    .select("*")
    .eq("shop_id", shopId)
    .eq("role", "seller")
    .maybeSingle();
  return data ? rowToAppUser(data) : null;
}
