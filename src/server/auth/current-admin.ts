import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import { getUserById } from "./user-service";
import type { AppUser } from "../types";

/** The logged-in admin, or null if the session isn't an admin. */
export async function getCurrentAdmin(): Promise<AppUser | null> {
  const meta = await getSession();
  if (!meta) return null;
  const user = await getUserById(meta.uid);
  if (!user || user.role !== "admin") return null;
  if (meta.iat < user.sessionsValidFrom) return null; // revoked
  return user;
}

/** Use at the top of any /admin page. Sellers go to their dashboard; guests to login. */
export async function requireAdmin(): Promise<AppUser> {
  const meta = await getSession();
  const admin = await getCurrentAdmin();
  if (!admin) redirect(meta ? "/dashboard" : "/login");
  return admin;
}
