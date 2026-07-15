import "server-only";
import { randomUUID } from "crypto";
import { getServerSupabase, isSupabaseConfigured } from "../supabase/server";
import { toWebp } from "../image";

const BUCKET = "product-images";
const DOCS_BUCKET = "verification-docs"; // PRIVATE — CNIC + selfie only
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB
export const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Demo-mode image store (in memory). Resets on server restart, like demo orders.
const demoImages = new Map<string, { buf: Buffer; contentType: string }>();

export function getDemoImage(id: string): { buf: Buffer; contentType: string } | null {
  return demoImages.get(id) ?? null;
}

function extFor(contentType: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "bin";
  }
}

/**
 * Store a product image and return a URL the storefront can load.
 * - Real mode: uploads to a public Supabase Storage bucket and returns its public URL.
 * - Demo mode: keeps the bytes in memory and returns a /api/uploads/demo/<id> URL.
 */
export async function saveProductImage(
  rawBuf: Buffer,
  rawType: string,
  shopId?: string
): Promise<string> {
  const { buf, contentType } = await toWebp(rawBuf, rawType);
  if (!isSupabaseConfigured()) {
    const id = randomUUID();
    demoImages.set(id, { buf, contentType });
    return `/api/uploads/demo/${id}`;
  }
  const supabase = getServerSupabase();
  const path = `${shopId ?? "shop"}/${randomUUID()}.${extFor(contentType)}`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, buf, { contentType, upsert: false });
  if (error) {
    console.error("saveProductImage:", error);
    throw new Error("Could not upload the image. Is the 'product-images' bucket created?");
  }
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Store an identity document (CNIC / selfie) in a PRIVATE bucket.
 * - Real mode: uploads to the private `verification-docs` bucket and returns the
 *   storage PATH (never a public URL). Admins view it via a short-lived signed URL.
 * - Demo mode: kept in memory, returned as a /api/uploads/demo/<id> reference.
 */
export async function saveVerificationDoc(
  rawBuf: Buffer,
  rawType: string,
  shopId: string
): Promise<string> {
  const { buf, contentType } = await toWebp(rawBuf, rawType);
  if (!isSupabaseConfigured()) {
    const id = randomUUID();
    demoImages.set(id, { buf, contentType });
    return `/api/uploads/demo/${id}`;
  }
  const supabase = getServerSupabase();
  const path = `${shopId}/${randomUUID()}.${extFor(contentType)}`;
  const { error } = await supabase.storage
    .from(DOCS_BUCKET)
    .upload(path, buf, { contentType, upsert: false });
  if (error) {
    console.error("saveVerificationDoc:", error);
    throw new Error("Could not upload the document. Is the private 'verification-docs' bucket created?");
  }
  return path; // store this path; resolve to a signed URL on demand
}

/** Resolve a stored verification doc reference to a viewable URL (admin only). */
export async function signedDocUrl(ref: string | null): Promise<string | null> {
  if (!ref) return null;
  if (!isSupabaseConfigured()) return ref; // demo: already a /api/uploads/demo/... URL
  if (/^https?:\/\//.test(ref)) return ref; // legacy public URL, if any
  const supabase = getServerSupabase();
  const { data, error } = await supabase.storage
    .from(DOCS_BUCKET)
    .createSignedUrl(ref, 120); // 2 minutes
  if (error || !data) {
    console.error("signedDocUrl:", error?.message);
    return null;
  }
  return data.signedUrl;
}

/** True if a value looks like one of OUR upload references (not an arbitrary URL). */
export function isOwnUploadRef(v: string): boolean {
  if (!v || v.length > 300) return false;
  if (/^\/api\/uploads\/demo\/[A-Za-z0-9-]+$/.test(v)) return true; // demo ref
  if (/^[A-Za-z0-9-]+\/[A-Za-z0-9-]+\.(webp|jpg|jpeg|png|gif)$/.test(v)) return true; // storage path
  return false;
}

/**
 * Delete ALL of a shop's uploaded files from storage (product images + the
 * private CNIC/selfie documents). Called on account deletion so a "delete my
 * data" request actually removes the identity documents, not just DB rows.
 * Files are stored under a `${shopId}/` prefix in each bucket. Best-effort:
 * never throws, so it can't block account deletion.
 */
export async function purgeShopStorage(shopId: string): Promise<void> {
  if (!shopId || !isSupabaseConfigured()) {
    // Demo mode keeps images in memory only; nothing persistent to purge.
    return;
  }
  const supabase = getServerSupabase();
  for (const bucket of [BUCKET, DOCS_BUCKET]) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list(shopId, { limit: 1000 });
      if (error || !data || data.length === 0) continue;
      const paths = data.map((f) => `${shopId}/${f.name}`);
      const { error: rmErr } = await supabase.storage.from(bucket).remove(paths);
      if (rmErr) console.error(`purgeShopStorage(${bucket}):`, rmErr.message);
    } catch (e) {
      console.error(`purgeShopStorage(${bucket}) threw:`, e);
    }
  }
}

/** Accept only product-image references WE produced: demo refs, our Supabase
 *  public Storage URLs, or same-origin relative paths. Rejects javascript:,
 *  data:, and arbitrary external hosts. */
export function isAllowedProductImageUrl(v: string): boolean {
  if (!v || v.length > 600) return false;
  if (v.startsWith("/")) return true; // same-origin (e.g. /api/uploads/demo/...)
  try {
    const u = new URL(v);
    if (u.protocol !== "https:") return false;
    // Supabase storage public URLs live under *.supabase.co
    if (u.hostname.endsWith(".supabase.co")) return true;
    const configured = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (configured && v.startsWith(configured)) return true;
    return false;
  } catch {
    return false;
  }
}
