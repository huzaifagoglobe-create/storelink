// ============================================================================
// Shared domain types (camelCase). The backend maps DB rows (snake_case)
// into these; the frontend only ever sees these clean shapes.
// ============================================================================

export type PlanTier = "trial" | "basic" | "pro" | "premium";
export type OrderStatus = "new" | "confirmed" | "delivered" | "cancelled";
export type PaymentMethod = "cod" | "online";

export type SubscriptionStatus = "active" | "pending" | "past_due" | "paused";

export interface Shop {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  address: string | null;
  industry: string | null;
  logoText: string | null;
  /** Uploaded brand logo image; shown instead of initials when set. */
  logoUrl: string | null;
  /** "Pages": short about-us text shown on /about (page hidden when empty). */
  aboutText: string | null;
  /** Return policy preset: '7day' | 'exchange' | 'none' (page hidden when null). */
  returnPolicy: string | null;
  /** Optional extra lines the seller adds under the return policy. */
  returnPolicyNote: string | null;
  whatsapp: string; // digits only, e.g. 923001234567
  paymentNote: string | null; // seller's own JazzCash/Easypaisa/Raast info
  freeDeliveryOver: number | null;
  deliveryFee: number;
  deliveryZones: DeliveryZone[];
  currency: string;
  themeColor: string | null;
  bannerStyle: "none" | "color" | "image";
  bannerImage: string | null;
  bannerHeading: string | null;
  bannerSubtext: string | null;
  verificationStatus: "unverified" | "pending" | "verified" | "rejected";
  cnicNumber: string | null;
  cnicImageUrl: string | null;
  selfieImageUrl: string | null;
  payoutMethod: string | null;
  payoutAccountName: string | null;
  payoutAccountNumber: string | null;
  verificationSubmittedAt: string | null;
  verificationReviewedAt: string | null;
  verificationNote: string | null;
  instagramUrl: string | null;
  facebookUrl: string | null;
  tiktokUrl: string | null;
  youtubeUrl: string | null;
  /** Where this shop's signup came from (?src= tracking), for Growth. */
  signupSource: string | null;
  /** Acquisition: where this signup came from (?src= tag). */
  /** Promo code used at signup, if any. */
  promoCode: string | null;
  /** Seller-refers-seller: slug of the shop that referred this one. */
  referredByShop: string | null;
  /** Whether the referring shop has been granted its free-month reward. */
  referrerRewarded: boolean;
  /** Bazaar curation: featured shops pin to the top of the Bazaar. */
  featured: boolean;
  /** Facebook/Meta Pixel ID — injected on the storefront for ad tracking. */
  fbPixelId: string | null;
  /** Google Analytics 4 measurement ID (G-XXXXXXX). */
  gaMeasurementId: string | null;
  /** Custom Google-result title/description (null = auto-generated). */
  seoTitle: string | null;
  seoDescription: string | null;
  /** Referral program: Rs off for referred friends (null/0 = off). */
  referralAmount: number | null;
  /** Flash sale: % off storewide until saleEndsAt (null/past = no sale). */
  salePercent: number | null;
  saleEndsAt: string | null;
  template: string;
  plan: PlanTier;
  isActive: boolean;
  trialEndsAt: string | null;
  subscriptionStatus: SubscriptionStatus;
  planExpiresAt: string | null;
  createdAt: string;
}

export type ProductTag = "hot" | "bestseller" | "new";

export interface Product {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  /** Optional longer write-up, shown in its own tab. Good for SEO. */
  longDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  /** What the seller pays for this item (private) — powers profit tracking. */
  costPrice: number | null;
  /** Optional product video link (YouTube embeds; TikTok/Instagram open in a new tab). */
  videoUrl: string | null;
  /** Live Drop: hidden "coming soon" until this time; not purchasable before it. */
  dropAt: string | null;
  /** Size chart image shown in a popup on the product page. */
  sizeChartUrl: string | null;
  stock: number;
  category: string | null;
  tag: ProductTag | null;
  imageUrls: string[];
  options: ProductOption[];
  /** Optional per-variant stock, keyed by the variant label (e.g. "Size: S / Color: Red"). */
  variantStock?: Record<string, number> | null;
  isActive: boolean;
  createdAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  name: string;
  price: number;
  /** Seller's cost per unit, snapshotted at order time (profit tracking). */
  cost?: number | null;
  quantity: number;
  variant: string | null;
}

export interface AbandonedCartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  variant: string | null;
}

export interface AbandonedCart {
  id: string;
  shopId: string;
  customerName: string | null;
  customerPhone: string;
  items: AbandonedCartItem[];
  subtotal: number;
  recovered: boolean;
  createdAt: string;
}

export interface Order {
  id: string; // human-friendly order number (e.g. 1043) — shown to the buyer
  publicToken: string; // unguessable id used in the public order URL
  shopId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  address: string;
  city: string;
  paymentMethod: PaymentMethod;
  subtotal: number;
  deliveryFee: number;
  total: number;
  discount: number;
  discountCode: string | null;
  status: OrderStatus;
  courier: string | null;
  trackingNumber: string | null;
  paymentState: "none" | "pending" | "paid" | "failed";
  gateway: string | null;
  gatewayRef: string | null;
  codCollected: boolean;
  /** Referral: token of the delivered order whose buyer referred this one. */
  referredBy?: string | null;
  /** Whether the referrer has been given their reward for this referral. */
  referralRewarded?: boolean;
  /** Reseller attribution code (from a tagged reseller link). */
  resellerCode?: string | null;
  createdAt: string;
  items: OrderItem[];
}

// What the checkout form sends to POST /api/orders
export interface CreateOrderInput {
  shopSlug: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  address: string;
  city: string;
  paymentMethod: PaymentMethod;
  discountCode?: string | null;
  /** Referral token (?ref=) — the referrer order's publicToken. */
  ref?: string | null;
  /** Reseller code (?rs=) for commission attribution. */
  resellerCode?: string | null;
  items: { productId: string; quantity: number; variant?: string | null }[];
}

// ---------------------------------------------------------------------------
// Auth + dashboard input shapes (Milestone 2)
// ---------------------------------------------------------------------------
export type UserRole = "seller" | "staff" | "admin";

export interface AppUser {
  id: string;
  email: string;
  fullName: string | null;
  shopId: string | null;
  role: UserRole;
  createdAt: string;
  /** Epoch ms. Sessions issued before this are invalid (set on password reset). */
  sessionsValidFrom: number;
  emailVerifiedAt: string | null;
}

/** A logged-in seller together with the shop they own. */
export interface SellerSession {
  user: AppUser;
  shop: Shop;
  /** False for staff accounts — they manage the shop but not Plan/Team/deletion. */
  isOwner: boolean;
}

export interface ShopInput {
  name: string;
  slug: string;
  tagline?: string | null;
  address?: string | null;
  industry?: string | null;
  logoText?: string | null;
  logoUrl?: string | null;
  aboutText?: string | null;
  returnPolicy?: string | null;
  returnPolicyNote?: string | null;
  whatsapp: string;
  paymentNote?: string | null;
  freeDeliveryOver?: number | null;
  deliveryFee?: number;
  deliveryZones?: DeliveryZone[];
  themeColor?: string | null;
  bannerStyle?: "none" | "color" | "image";
  bannerImage?: string | null;
  bannerHeading?: string | null;
  bannerSubtext?: string | null;
  instagramUrl?: string | null;
  facebookUrl?: string | null;
  tiktokUrl?: string | null;
  youtubeUrl?: string | null;
  trialEndsAt?: string | null;
  signupSource?: string | null;
  promoCode?: string | null;
  referredByShop?: string | null;
  referrerRewarded?: boolean;
  featured?: boolean;
  fbPixelId?: string | null;
  gaMeasurementId?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  referralAmount?: number | null;
  salePercent?: number | null;
  saleEndsAt?: string | null;
  template?: string;
  isActive?: boolean;
}

export interface ProductInput {
  name: string;
  description?: string | null;
  longDescription?: string | null;
  price: number;
  compareAtPrice?: number | null;
  costPrice?: number | null;
  videoUrl?: string | null;
  dropAt?: string | null;
  sizeChartUrl?: string | null;
  stock: number;
  category?: string | null;
  tag?: ProductTag | null;
  imageUrls?: string[];
  options?: ProductOption[];
  variantStock?: Record<string, number> | null;
  isActive?: boolean;
}

export interface Category {
  id: string;
  shopId: string;
  name: string;
  slug: string;
  sortOrder: number;
  createdAt: string;
}

export interface CategoryInput {
  name: string;
  sortOrder?: number;
}

export type DiscountType = "percent" | "fixed";

export interface Discount {
  id: string;
  shopId: string;
  code: string;
  type: DiscountType;
  value: number;
  isActive: boolean;
  createdAt: string;
}

export interface DiscountInput {
  code: string;
  type: DiscountType;
  value: number;
  isActive?: boolean;
}

export interface Customer {
  name: string;
  phone: string;
  orderCount: number;
  totalSpent: number; // sum of delivered order totals
  lastOrderAt: string;
}

export interface DeliveryZone {
  city: string;
  fee: number;
}

export interface Review {
  id: string;
  shopId: string;
  productId: string;
  rating: number; // 1-5
  author: string;
  comment: string;
  photos: string[];
  createdAt: string;
}

export interface ProductOption {
  name: string;
  values: string[];
}

export interface ShopReport {
  id: string;
  shopId: string;
  reason: string;
  details: string | null;
  status: "open" | "dismissed";
  createdAt: string;
}

export interface Reseller {
  id: string;
  shopId: string;
  name: string;
  phone: string;
  code: string;
  commissionPercent: number;
  createdAt: string;
}

export interface Expense {
  id: string;
  shopId: string;
  amount: number;
  category: string;
  note: string | null;
  spentOn: string; // YYYY-MM-DD
  createdAt: string;
}

export interface Announcement {
  id: string;
  message: string;
  isActive: boolean;
  createdAt: string;
}

export interface SubscriptionPayment {
  id: string;
  shopId: string;
  amount: number;
  plan: string;
  months: number;
  method: string;
  reference: string | null;
  createdAt: string;
}

export interface Story {
  id: string;
  slug: string;
  title: string;
  shopId: string | null;
  body: string;
  published: boolean;
  createdAt: string;
}

export type SellerLeadStatus = "new" | "contacted" | "won" | "lost";

export interface SellerLead {
  id: string;
  name: string;
  whatsapp: string;
  selling: string | null;
  source: string | null;
  status: SellerLeadStatus;
  createdAt: string;
}

export interface PromoCode {
  id: string;
  code: string;
  trialDays: number;
  isActive: boolean;
  uses: number;
  createdAt: string;
}

export interface SellerStory {
  id: string;
  slug: string;
  title: string;
  sellerName: string;
  body: string;
  isPublished: boolean;
  createdAt: string;
}
