"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { rateLimitDb, ipFromForwarded } from "@/lib/rate-limit";
import { findUserForLogin, createUser, setUserPassword } from "../auth/user-service";
import { verifyPassword } from "../auth/password";
import { credentialError, PASSWORD_MAX, type CredentialKind } from "../auth/credential-policy";
import { setSessionCookie, clearSessionCookie } from "../auth/session";
import { createShop, isSlugTaken, deleteShop, updateShop, getShopBySlug } from "../services/shop-service";
import { redeemPromoCode } from "../services/growth-services";
import { createProduct } from "../services/product-service";
import { SAMPLE_PRODUCTS } from "../sample-products";
import { str, optStr, normalizeSlug, normalizePhone } from "../validate";
import { SITE_URL } from "@/lib/site";
import { sendEmail } from "../email";
import { sendVerificationEmail } from "../auth/email-verify";
import { createPasswordReset, consumePasswordReset } from "../services/password-reset-service";

export interface AuthState {
  error?: string;
  sent?: boolean;
  done?: boolean;
  /**
   * What the seller typed. Returned on EVERY failure so the form can put it
   * straight back. Losing a filled-in form because of one weak PIN is the
   * fastest way to lose a signup. The credential itself is never echoed.
   */
  values?: {
    shopName?: string;
    slug?: string;
    industry?: string;
    industryOther?: string;
    fullName?: string;
    email?: string;
    whatsapp?: string;
    promo?: string;
    credentialKind?: CredentialKind;
  };
}

async function reqIp(): Promise<string> {
  const h = await headers();
  return ipFromForwarded(h.get("x-forwarded-for"), h.get("x-real-ip"));
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = str(formData.get("email"), 200);
  // Not capped at 6: a seller may have chosen a password, not a PIN.
  const pin = str(formData.get("pin"), PASSWORD_MAX);
  if (!email || !pin) return { error: "Please enter your email and PIN." };

  // Brute-force protection: cap attempts per IP and per account.
  const ip = await reqIp();
  const tooMany = "Too many attempts. Please wait a few minutes and try again.";
  if (!(await rateLimitDb(`login-ip:${ip}`, 10, 15 * 60))) return { error: tooMany };
  if (!(await rateLimitDb(`login-acct:${email.toLowerCase()}`, 5, 15 * 60))) return { error: tooMany };

  const found = await findUserForLogin(email);
  if (!found || !verifyPassword(pin, found.passwordHash)) {
    return { error: "Wrong email or PIN. Please try again." };
  }

  if (found.user.role === "admin") {
    await setSessionCookie(found.user.id);
    redirect("/admin");
  }
  if (!found.user.shopId) return { error: "This account doesn't have a shop yet." };

  await setSessionCookie(found.user.id);
  redirect("/dashboard");
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  if (!(await rateLimitDb(`signup-ip:${await reqIp()}`, 6, 60 * 60))) {
    return { error: "Too many sign-ups from this connection. Please try again later." };
  }
  const fullName = optStr(formData.get("fullName"), 120);
  const email = str(formData.get("email"), 200);
  const shopName = str(formData.get("shopName"), 80);
  const slug = normalizeSlug(str(formData.get("slug"), 60));
  const whatsapp = normalizePhone(str(formData.get("whatsapp"), 40));
  const kind: CredentialKind = formData.get("credentialKind") === "password" ? "password" : "pin";
  const cap = kind === "password" ? PASSWORD_MAX : 6;
  const pin = str(formData.get("pin"), cap);
  const confirmPin = str(formData.get("confirmPin"), cap);

  const industryChoice = str(formData.get("industry"), 60);
  const industryOther = str(formData.get("industryOther"), 60);
  const industry =
    industryChoice === "Other" ? industryOther || null : industryChoice || null;

  // Everything the seller typed, handed back with any error so the form can
  // refill itself. Never includes the PIN/password.
  const values: AuthState["values"] = {
    shopName, slug, industry: industryChoice, industryOther,
    fullName: fullName ?? "", email, whatsapp: str(formData.get("whatsapp"), 40),
    promo: str(formData.get("promo"), 40), credentialKind: kind,
  };
  const fail = (error: string): AuthState => ({ error, values });

  if (!email || !shopName || !slug || !whatsapp) {
    return fail("Please fill in your shop name, link, WhatsApp number and email.");
  }
  if (slug.length < 3) {
    return fail("Your shop link must be at least 3 characters (letters, numbers, dashes).");
  }
  if (whatsapp.length < 8) return fail("Please enter a valid WhatsApp number.");
  const credErr = credentialError(pin, kind);
  if (credErr) return fail(credErr);
  if (pin !== confirmPin) {
    return fail(kind === "pin"
      ? "The two PINs don't match. Please re-enter them."
      : "The two passwords don't match. Please re-enter them.");
  }
  if (industryChoice === "Other" && !industryOther) {
    return fail("Please type your industry.");
  }

  if (await findUserForLogin(email)) {
    return fail("An account with this email already exists.");
  }
  if (await isSlugTaken(slug)) {
    return fail("That shop link is already taken. Please pick another.");
  }

  // Acquisition tracking: ?src / ?promo / ?rf captured by the signup page.
  const signupSource = optStr(formData.get("src"), 40);
  const promoRaw = optStr(formData.get("promo"), 30);
  const rfRaw = optStr(formData.get("rf"), 60);
  // Seller-refers-seller: only record a real, different shop.
  let referredByShop: string | null = null;
  if (rfRaw && rfRaw !== slug) {
    const refShop = await getShopBySlug(rfRaw);
    if (refShop) referredByShop = refShop.slug;
  }
  // Promo code: valid code = longer trial (e.g. EID45 → 45 days).
  const promoDays = promoRaw ? await redeemPromoCode(promoRaw) : null;

  let shopId: string;
  try {
    const shop = await createShop({
      name: shopName,
      slug,
      whatsapp,
      industry,
      signupSource,
      promoCode: promoDays !== null ? (promoRaw as string).toUpperCase() : null,
      referredByShop,
    });
    shopId = shop.id;
    if (promoDays !== null) {
      await updateShop(shopId, { trialEndsAt: new Date(Date.now() + promoDays * 86_400_000).toISOString() });
    }
    // Kill the blank canvas: seed 3 sample DRAFT products for their industry.
    // Drafts don't show on the live store — the dashboard just isn't empty.
    const samples = SAMPLE_PRODUCTS[industry ?? "Other"] ?? SAMPLE_PRODUCTS.Other;
    for (const sp of samples) {
      await createProduct(shopId, { ...sp, isActive: false });
    }
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Could not create the shop." };
  }

  try {
    const user = await createUser({ email, password: pin, fullName, shopId });
    await setSessionCookie(user.id);
    await sendVerificationEmail(user.id, email);
  } catch (e) {
    // Roll back the just-created shop so a failed sign-up leaves no orphan.
    await deleteShop(shopId);
    return { error: e instanceof Error ? e.message : "Could not create the account." };
  }

  redirect("/dashboard");
}

export async function signOutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/login");
}

export async function requestPasswordResetAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const email = str(formData.get("email"), 200);
  if (!email) return { error: "Please enter your email." };

  // Rate limit silently (still return the same "sent" response to avoid enumeration).
  const ip = await reqIp();
  const okIp = await rateLimitDb(`pwreset-ip:${ip}`, 5, 60 * 60);
  const okAcct = await rateLimitDb(`pwreset-acct:${email.toLowerCase()}`, 3, 60 * 60);
  if (!okIp || !okAcct) return { sent: true };

  // Look up quietly. We always return the same "sent" response regardless of
  // whether the email exists, so this can't be used to discover accounts.
  const found = await findUserForLogin(email);
  if (found) {
    try {
      const token = await createPasswordReset(found.user.id);
      const link = `${SITE_URL}/reset-password?token=${token}`;
      await sendEmail({
        to: found.user.email,
        subject: "Reset your StoreLink PIN",
        text: `We received a request to reset your PIN.\n\nUse this link (valid for 30 minutes, one time only):\n${link}\n\nIf you didn't request this, you can safely ignore this email — your PIN won't change.`,
        html: `<p>We received a request to reset your PIN.</p>
<p><a href="${link}" style="display:inline-block;background:#43705f;color:#fff;padding:11px 20px;border-radius:10px;text-decoration:none;font-weight:600">Reset my PIN</a></p>
<p style="color:#6e7a75;font-size:13px">This link is valid for 30 minutes and can be used once. If you didn't request this, you can safely ignore this email — your PIN won't change.</p>`,
      });
    } catch (e) {
      // Never reveal failures to the visitor; just log for ourselves.
      console.error("password reset request failed:", e);
    }
  }
  return { sent: true };
}

export async function resetPasswordAction(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const token = str(formData.get("token"), 200);
  const kind: CredentialKind = formData.get("credentialKind") === "password" ? "password" : "pin";
  const pin = str(formData.get("pin"), kind === "password" ? PASSWORD_MAX : 6);
  const confirmPin = str(formData.get("confirmPin"), 6);

  if (!(await rateLimitDb(`pwreset-confirm-ip:${await reqIp()}`, 12, 15 * 60))) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }
  if (!token) return { error: "This reset link is invalid. Please request a new one." };
  const newErr = credentialError(pin, kind);
  if (newErr) return { error: newErr };
  if (pin !== confirmPin) return { error: "The two PINs don't match. Please re-enter them." };

  const userId = await consumePasswordReset(token);
  if (!userId) {
    return { error: "This reset link is invalid or has expired. Please request a new one." };
  }
  await setUserPassword(userId, pin);
  return { done: true };
}

export async function resendVerificationAction(): Promise<void> {
  const { getCurrentSeller } = await import("../auth/current-seller");
  const session = await getCurrentSeller();
  if (!session || session.user.emailVerifiedAt) return;
  if (!(await rateLimitDb(`verify-resend:${session.user.id}`, 3, 60 * 60))) return;
  await sendVerificationEmail(session.user.id, session.user.email);
}
