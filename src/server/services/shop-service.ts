// Shop data access. Falls back to demo data when Supabase is not configured.
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import { mockShops } from "../mock-data";
import type { PlanTier, Shop, ShopInput } from "../types";
import { decryptField } from "../crypto";
import { TRIAL_DAYS } from "../plans";
import { initialSubscriptionStatus } from "../billing";

function rowToShop(r: any): Shop {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    tagline: r.tagline,
    address: r.address ?? null,
    industry: r.industry ?? null,
    logoText: r.logo_text,
    logoUrl: r.logo_url ?? null,
    aboutText: r.about_text ?? null,
    returnPolicy: r.return_policy ?? null,
    returnPolicyNote: r.return_policy_note ?? null,
    whatsapp: r.whatsapp,
    paymentNote: r.payment_note,
    freeDeliveryOver: r.free_delivery_over === null ? null : Number(r.free_delivery_over),
    deliveryFee: Number(r.delivery_fee),
    deliveryZones: Array.isArray(r.delivery_zones) ? r.delivery_zones : [],
    currency: r.currency,
    themeColor: r.theme_color ?? null,
    bannerStyle: r.banner_style ?? "none",
    bannerImage: r.banner_image ?? null,
    bannerHeading: r.banner_heading ?? null,
    bannerSubtext: r.banner_subtext ?? null,
    verificationStatus: r.verification_status ?? "unverified",
    cnicNumber: decryptField(r.cnic_number ?? null),
    cnicImageUrl: r.cnic_image_url ?? null,
    selfieImageUrl: r.selfie_image_url ?? null,
    payoutMethod: r.payout_method ?? null,
    payoutAccountName: r.payout_account_name ?? null,
    payoutAccountNumber: decryptField(r.payout_account_number ?? null),
    verificationSubmittedAt: r.verification_submitted_at ?? null,
    verificationReviewedAt: r.verification_reviewed_at ?? null,
    verificationNote: r.verification_note ?? null,
    instagramUrl: r.instagram_url ?? null,
    facebookUrl: r.facebook_url ?? null,
    tiktokUrl: r.tiktok_url ?? null,
    youtubeUrl: r.youtube_url ?? null,
    signupSource: r.signup_source ?? null,
    promoCode: r.promo_code ?? null,
    referredByShop: r.referred_by_shop ?? null,
    referrerRewarded: r.referrer_rewarded ?? false,
    featured: r.featured ?? false,
    fbPixelId: r.fb_pixel_id ?? null,
    gaMeasurementId: r.ga_measurement_id ?? null,
    seoTitle: r.seo_title ?? null,
    seoDescription: r.seo_description ?? null,
    referralAmount: r.referral_amount === null || r.referral_amount === undefined ? null : Number(r.referral_amount),
    salePercent: r.sale_percent === null || r.sale_percent === undefined ? null : Number(r.sale_percent),
    saleEndsAt: r.sale_ends_at ?? null,
    template: r.template ?? "classic",
    plan: r.plan,
    isActive: r.is_active,
    trialEndsAt: r.trial_ends_at ?? null,
    subscriptionStatus: (r.subscription_status ?? "active"),
    planExpiresAt: r.plan_expires_at ?? null,
    createdAt: r.created_at,
  };
}

/** Public storefront lookup — only returns ACTIVE shops. */
export async function getShopBySlug(slug: string): Promise<Shop | null> {
  // Returns the shop whether or not it is "open" — callers decide what to show
  // (a closed/paused shop renders a friendly "temporarily closed" page, never a 404).
  if (!isSupabaseConfigured()) {
    return mockShops.find((s) => s.slug === slug) ?? null;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  return rowToShop(data);
}

/** Owner lookup by id — returns the shop even if it is paused (inactive). */
export async function getShopById(id: string): Promise<Shop | null> {
  if (!isSupabaseConfigured()) {
    return mockShops.find((s) => s.id === id) ?? null;
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase.from("shops").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return rowToShop(data);
}

export async function isSlugTaken(slug: string, exceptShopId?: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    return mockShops.some((s) => s.slug === slug && s.id !== exceptShopId);
  }
  const supabase = getServerSupabase();
  let q = supabase.from("shops").select("id").eq("slug", slug);
  if (exceptShopId) q = q.neq("id", exceptShopId);
  const { data } = await q.maybeSingle();
  return Boolean(data);
}

export async function createShop(input: ShopInput): Promise<Shop> {
  if (!isSupabaseConfigured()) {
    if (mockShops.some((s) => s.slug === input.slug)) {
      throw new Error("That shop link is already taken.");
    }
    const shop: Shop = {
      id: `shop-${Date.now()}`,
      slug: input.slug,
      name: input.name,
      tagline: input.tagline ?? null,
      address: input.address ?? null,
      industry: input.industry ?? null,
      logoText: input.logoText ?? null,
      logoUrl: input.logoUrl ?? null,
      aboutText: input.aboutText ?? null,
      returnPolicy: input.returnPolicy ?? null,
      returnPolicyNote: input.returnPolicyNote ?? null,
      whatsapp: input.whatsapp,
      paymentNote: input.paymentNote ?? null,
      freeDeliveryOver: input.freeDeliveryOver ?? null,
      deliveryFee: input.deliveryFee ?? 0,
      deliveryZones: input.deliveryZones ?? [],
      currency: "PKR",
      themeColor: input.themeColor ?? null,
      bannerStyle: input.bannerStyle ?? "none",
      bannerImage: input.bannerImage ?? null,
      bannerHeading: input.bannerHeading ?? null,
      bannerSubtext: input.bannerSubtext ?? null,
      verificationStatus: "unverified",
      cnicNumber: null,
      cnicImageUrl: null,
      selfieImageUrl: null,
      payoutMethod: null,
      payoutAccountName: null,
      payoutAccountNumber: null,
      verificationSubmittedAt: null,
      verificationReviewedAt: null,
      verificationNote: null,
      instagramUrl: input.instagramUrl ?? null,
      facebookUrl: input.facebookUrl ?? null,
      tiktokUrl: input.tiktokUrl ?? null,
      youtubeUrl: input.youtubeUrl ?? null,
      signupSource: input.signupSource ?? null,
      promoCode: input.promoCode ?? null,
      referredByShop: input.referredByShop ?? null,
      referrerRewarded: false,
      featured: false,
      fbPixelId: null,
      gaMeasurementId: null,
      seoTitle: null,
      seoDescription: null,
      referralAmount: null,
      salePercent: null,
      saleEndsAt: null,
      template: input.template ?? "classic",
      plan: "trial",
      isActive: input.isActive ?? true,
      trialEndsAt: new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString(),
      subscriptionStatus: initialSubscriptionStatus(),
      planExpiresAt: null,
      createdAt: new Date().toISOString(),
    };
    mockShops.push(shop);
    return shop;
  }

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("shops")
    .insert({
      slug: input.slug,
      name: input.name,
      signup_source: input.signupSource ?? null,
      promo_code: input.promoCode ?? null,
      referred_by_shop: input.referredByShop ?? null,
      tagline: input.tagline ?? null,
      address: input.address ?? null,
      industry: input.industry ?? null,
      logo_text: input.logoText ?? null,
      logo_url: input.logoUrl ?? null,
      about_text: input.aboutText ?? null,
      return_policy: input.returnPolicy ?? null,
      return_policy_note: input.returnPolicyNote ?? null,
      whatsapp: input.whatsapp,
      payment_note: input.paymentNote ?? null,
      free_delivery_over: input.freeDeliveryOver ?? null,
      delivery_fee: input.deliveryFee ?? 0,
      delivery_zones: input.deliveryZones ?? [],
      theme_color: input.themeColor ?? null,
      banner_style: input.bannerStyle ?? "none",
      banner_image: input.bannerImage ?? null,
      banner_heading: input.bannerHeading ?? null,
      banner_subtext: input.bannerSubtext ?? null,
      is_active: input.isActive ?? true,
      trial_ends_at: new Date(Date.now() + TRIAL_DAYS * 86_400_000).toISOString(),
      subscription_status: initialSubscriptionStatus(),
    })
    .select("*")
    .single();
  if (error || !data) {
    if ((error as any)?.code === "23505") throw new Error("That shop link is already taken.");
    console.error("createShop:", error);
    throw new Error("Could not create the shop. Please try again.");
  }
  return rowToShop(data);
}

export async function updateShop(
  shopId: string,
  patch: Partial<ShopInput>
): Promise<Shop> {
  if (!isSupabaseConfigured()) {
    const shop = mockShops.find((s) => s.id === shopId);
    if (!shop) throw new Error("Shop not found.");
    if (patch.slug && patch.slug !== shop.slug && mockShops.some((s) => s.slug === patch.slug)) {
      throw new Error("That shop link is already taken.");
    }
    Object.assign(shop, {
      name: patch.name ?? shop.name,
      slug: patch.slug ?? shop.slug,
      tagline: patch.tagline === undefined ? shop.tagline : patch.tagline,
      address: patch.address === undefined ? shop.address : patch.address,
      logoText: patch.logoText === undefined ? shop.logoText : patch.logoText,
      logoUrl: patch.logoUrl === undefined ? shop.logoUrl : patch.logoUrl,
      aboutText: patch.aboutText === undefined ? shop.aboutText : patch.aboutText,
      returnPolicy: patch.returnPolicy === undefined ? shop.returnPolicy : patch.returnPolicy,
      returnPolicyNote: patch.returnPolicyNote === undefined ? shop.returnPolicyNote : patch.returnPolicyNote,
      whatsapp: patch.whatsapp ?? shop.whatsapp,
      paymentNote: patch.paymentNote === undefined ? shop.paymentNote : patch.paymentNote,
      freeDeliveryOver:
        patch.freeDeliveryOver === undefined ? shop.freeDeliveryOver : patch.freeDeliveryOver,
      deliveryFee: patch.deliveryFee ?? shop.deliveryFee,
      deliveryZones: patch.deliveryZones ?? shop.deliveryZones,
      themeColor: patch.themeColor === undefined ? shop.themeColor : patch.themeColor,
      bannerStyle: patch.bannerStyle ?? shop.bannerStyle,
      bannerImage: patch.bannerImage === undefined ? shop.bannerImage : patch.bannerImage,
      bannerHeading: patch.bannerHeading === undefined ? shop.bannerHeading : patch.bannerHeading,
      bannerSubtext: patch.bannerSubtext === undefined ? shop.bannerSubtext : patch.bannerSubtext,
      instagramUrl: patch.instagramUrl === undefined ? shop.instagramUrl : patch.instagramUrl,
      facebookUrl: patch.facebookUrl === undefined ? shop.facebookUrl : patch.facebookUrl,
      tiktokUrl: patch.tiktokUrl === undefined ? shop.tiktokUrl : patch.tiktokUrl,
      youtubeUrl: patch.youtubeUrl === undefined ? shop.youtubeUrl : patch.youtubeUrl,
      trialEndsAt: patch.trialEndsAt === undefined ? shop.trialEndsAt : patch.trialEndsAt,
      signupSource: patch.signupSource === undefined ? shop.signupSource : patch.signupSource,
      promoCode: patch.promoCode === undefined ? shop.promoCode : patch.promoCode,
      referredByShop: patch.referredByShop === undefined ? shop.referredByShop : patch.referredByShop,
      referrerRewarded: patch.referrerRewarded === undefined ? shop.referrerRewarded : patch.referrerRewarded,
      featured: patch.featured === undefined ? shop.featured : patch.featured,
      fbPixelId: patch.fbPixelId === undefined ? shop.fbPixelId : patch.fbPixelId,
      gaMeasurementId: patch.gaMeasurementId === undefined ? shop.gaMeasurementId : patch.gaMeasurementId,
      seoTitle: patch.seoTitle === undefined ? shop.seoTitle : patch.seoTitle,
      seoDescription: patch.seoDescription === undefined ? shop.seoDescription : patch.seoDescription,
      referralAmount: patch.referralAmount === undefined ? shop.referralAmount : patch.referralAmount,
      salePercent: patch.salePercent === undefined ? shop.salePercent : patch.salePercent,
      saleEndsAt: patch.saleEndsAt === undefined ? shop.saleEndsAt : patch.saleEndsAt,
      template: patch.template ?? shop.template,
      isActive: patch.isActive ?? shop.isActive,
    });
    return shop;
  }

  const row: Record<string, unknown> = {};
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.slug !== undefined) row.slug = patch.slug;
  if (patch.tagline !== undefined) row.tagline = patch.tagline;
  if (patch.address !== undefined) row.address = patch.address;
  if (patch.logoText !== undefined) row.logo_text = patch.logoText;
  if (patch.logoUrl !== undefined) row.logo_url = patch.logoUrl;
  if (patch.aboutText !== undefined) row.about_text = patch.aboutText;
  if (patch.returnPolicy !== undefined) row.return_policy = patch.returnPolicy;
  if (patch.returnPolicyNote !== undefined) row.return_policy_note = patch.returnPolicyNote;
  if (patch.whatsapp !== undefined) row.whatsapp = patch.whatsapp;
  if (patch.paymentNote !== undefined) row.payment_note = patch.paymentNote;
  if (patch.freeDeliveryOver !== undefined) row.free_delivery_over = patch.freeDeliveryOver;
  if (patch.deliveryFee !== undefined) row.delivery_fee = patch.deliveryFee;
  if (patch.deliveryZones !== undefined) row.delivery_zones = patch.deliveryZones;
  if (patch.themeColor !== undefined) row.theme_color = patch.themeColor;
  if (patch.bannerStyle !== undefined) row.banner_style = patch.bannerStyle;
  if (patch.bannerImage !== undefined) row.banner_image = patch.bannerImage;
  if (patch.bannerHeading !== undefined) row.banner_heading = patch.bannerHeading;
  if (patch.bannerSubtext !== undefined) row.banner_subtext = patch.bannerSubtext;
  if (patch.instagramUrl !== undefined) row.instagram_url = patch.instagramUrl;
  if (patch.facebookUrl !== undefined) row.facebook_url = patch.facebookUrl;
  if (patch.tiktokUrl !== undefined) row.tiktok_url = patch.tiktokUrl;
  if (patch.youtubeUrl !== undefined) row.youtube_url = patch.youtubeUrl;
  if (patch.trialEndsAt !== undefined) row.trial_ends_at = patch.trialEndsAt;
  if (patch.signupSource !== undefined) row.signup_source = patch.signupSource;
  if (patch.promoCode !== undefined) row.promo_code = patch.promoCode;
  if (patch.referredByShop !== undefined) row.referred_by_shop = patch.referredByShop;
  if (patch.referrerRewarded !== undefined) row.referrer_rewarded = patch.referrerRewarded;
  if (patch.featured !== undefined) row.featured = patch.featured;
  if (patch.fbPixelId !== undefined) row.fb_pixel_id = patch.fbPixelId;
  if (patch.gaMeasurementId !== undefined) row.ga_measurement_id = patch.gaMeasurementId;
  if (patch.seoTitle !== undefined) row.seo_title = patch.seoTitle;
  if (patch.seoDescription !== undefined) row.seo_description = patch.seoDescription;
  if (patch.referralAmount !== undefined) row.referral_amount = patch.referralAmount;
  if (patch.salePercent !== undefined) row.sale_percent = patch.salePercent;
  if (patch.saleEndsAt !== undefined) row.sale_ends_at = patch.saleEndsAt;
  if (patch.template !== undefined) row.template = patch.template;
  if (patch.isActive !== undefined) row.is_active = patch.isActive;

  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("shops")
    .update(row)
    .eq("id", shopId)
    .select("*")
    .single();
  if (error || !data) {
    if ((error as any)?.code === "23505") throw new Error("That shop link is already taken.");
    console.error("updateShop:", error);
    throw new Error("Could not save your changes. Please try again.");
  }
  return rowToShop(data);
}

// --------------------------- Admin (platform) ------------------------------

/** Admin god-view: every shop, active or paused (newest first). */
export async function listAllShops(): Promise<Shop[]> {
  if (!isSupabaseConfigured()) {
    return [...mockShops];
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("shops")
    .select("*")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map(rowToShop);
}

export async function setShopPlan(shopId: string, plan: PlanTier): Promise<void> {
  if (!isSupabaseConfigured()) {
    const s = mockShops.find((x) => x.id === shopId);
    if (s) s.plan = plan;
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase.from("shops").update({ plan }).eq("id", shopId);
  if (error) {
    console.error("setShopPlan:", error);
    throw new Error("Could not update the plan.");
  }
}

export async function setShopActive(shopId: string, active: boolean): Promise<void> {
  if (!isSupabaseConfigured()) {
    const s = mockShops.find((x) => x.id === shopId);
    if (s) s.isActive = active;
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase.from("shops").update({ is_active: active }).eq("id", shopId);
  if (error) {
    console.error("setShopActive:", error);
    throw new Error("Could not update the shop.");
  }
}

/** Remove a shop (used to roll back a failed sign-up so no orphan is left). */
export async function deleteShop(shopId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const i = mockShops.findIndex((s) => s.id === shopId);
    if (i >= 0) mockShops.splice(i, 1);
    return;
  }
  const supabase = getServerSupabase();
  const { error } = await supabase.from("shops").delete().eq("id", shopId);
  if (error) console.error("deleteShop:", error.message);
}

/** Record a manual/gateway payment and activate the shop for `months` months. */
// Demo-mode payment records (real mode uses the subscription_payments table).
const gp = globalThis as unknown as { __wsbSubPayments?: import("../types").SubscriptionPayment[] };
gp.__wsbSubPayments ??= [];

/** Recent subscription payments, newest first (platform-wide). */
export async function listRecentPayments(limit = 15): Promise<import("../types").SubscriptionPayment[]> {
  if (!isSupabaseConfigured()) {
    return [...(gp.__wsbSubPayments ?? [])].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, limit);
  }
  const supabase = getServerSupabase();
  const { data, error } = await supabase
    .from("subscription_payments")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("listRecentPayments:", error.message);
    return [];
  }
  return (data ?? []).map((r) => ({
    id: r.id,
    shopId: r.shop_id,
    amount: Number(r.amount),
    plan: r.plan,
    months: Number(r.months),
    method: r.method,
    reference: r.reference ?? null,
    createdAt: r.created_at,
  }));
}

export async function activateSubscription(
  shopId: string,
  opts: { plan: string; months: number; amount: number; method?: string; reference?: string; recordedBy?: string }
): Promise<void> {
  const months = Math.max(1, Math.min(36, Math.floor(opts.months)));
  if (!isSupabaseConfigured()) {
    const shop = mockShops.find((x) => x.id === shopId);
    if (!shop) return;
    const base =
      shop.planExpiresAt && new Date(shop.planExpiresAt).getTime() > Date.now()
        ? new Date(shop.planExpiresAt)
        : new Date();
    base.setMonth(base.getMonth() + months);
    shop.subscriptionStatus = "active";
    shop.planExpiresAt = base.toISOString();
    if (["trial", "basic", "pro", "premium"].includes(opts.plan)) shop.plan = opts.plan as Shop["plan"];
    gp.__wsbSubPayments!.push({
      id: `pay-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      shopId,
      amount: opts.amount,
      plan: opts.plan,
      months,
      method: opts.method ?? "manual",
      reference: opts.reference ?? null,
      createdAt: new Date().toISOString(),
    });
    return;
  }
  const supabase = getServerSupabase();
  // Idempotency: if we've already recorded a payment with this gateway
  // reference for this shop, don't extend the period again (safe against
  // webhook retries/replays).
  if (opts.reference) {
    const { data: dup } = await supabase
      .from("subscription_payments")
      .select("id")
      .eq("shop_id", shopId)
      .eq("reference", opts.reference)
      .maybeSingle();
    if (dup) return;
  }
  const { data: row } = await supabase
    .from("shops").select("plan_expires_at").eq("id", shopId).maybeSingle();
  const current = row?.plan_expires_at ? new Date(row.plan_expires_at) : null;
  const base = current && current.getTime() > Date.now() ? current : new Date();
  base.setMonth(base.getMonth() + months);

  const patch: Record<string, unknown> = {
    subscription_status: "active",
    plan_expires_at: base.toISOString(),
  };
  if (["trial", "basic", "pro", "premium"].includes(opts.plan)) patch.plan = opts.plan;
  await supabase.from("shops").update(patch).eq("id", shopId);
  await supabase.from("subscription_payments").insert({
    shop_id: shopId,
    amount: opts.amount,
    plan: opts.plan,
    months,
    method: opts.method ?? "manual",
    reference: opts.reference ?? null,
    recorded_by: opts.recordedBy ?? "admin",
  });
}

/** Pause a shop (storefront shows "temporarily closed", dashboard locks). Data is kept. */
export async function pauseSubscription(shopId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const shop = mockShops.find((x) => x.id === shopId);
    if (shop) shop.subscriptionStatus = "paused";
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("shops").update({ subscription_status: "paused" }).eq("id", shopId);
}

/** Set status directly (used by the webhook / admin). */
export async function setSubscriptionStatus(shopId: string, status: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    const shop = mockShops.find((x) => x.id === shopId);
    if (shop) shop.subscriptionStatus = status as Shop["subscriptionStatus"];
    return;
  }
  const supabase = getServerSupabase();
  await supabase.from("shops").update({ subscription_status: status }).eq("id", shopId);
}
