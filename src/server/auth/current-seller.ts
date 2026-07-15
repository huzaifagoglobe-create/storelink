import "server-only";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import { getUserById } from "./user-service";
import { getShopById } from "../services/shop-service";
import type { SellerSession } from "../types";

/** The logged-in seller + their shop, or null if not signed in. */
export async function getCurrentSeller(): Promise<SellerSession | null> {
  const meta = await getSession();
  if (!meta) return null;
  const user = await getUserById(meta.uid);
  if (!user || !user.shopId) return null;
  // Revocation: a password reset (or "log out everywhere") invalidates older sessions.
  if (meta.iat < user.sessionsValidFrom) return null;
  const shop = await getShopById(user.shopId);
  if (!shop) return null;
  return { user, shop, isOwner: user.role !== "staff" };
}

/** Use at the top of any protected page; redirects to /login when signed out. */
export async function requireSeller(): Promise<SellerSession> {
  const session = await getCurrentSeller();
  if (!session) redirect("/login");
  return session;
}
