"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { getShopBySlug } from "../services/shop-service";
import { createReport, dismissReport } from "../services/report-service";
import { requireAdmin } from "../auth/current-admin";
import { rateLimitDb, ipFromForwarded } from "@/lib/rate-limit";
import { str } from "../validate";

export interface ReportState {
  error?: string;
  done?: boolean;
}

const REASONS = ["didnt_deliver", "fake_products", "fraud", "other"];

export async function submitReportAction(
  _prev: ReportState,
  formData: FormData
): Promise<ReportState> {
  // Anti-abuse: cap how many reports one connection can file (stops a
  // competitor flooding a shop with fake reports).
  const h = await headers();
  const ip = ipFromForwarded(h.get("x-forwarded-for"), h.get("x-real-ip"));
  if (!(await rateLimitDb(`report-ip:${ip}`, 5, 60 * 60))) {
    return { error: "Too many reports from this connection. Please try again later." };
  }
  const slug = str(formData.get("slug"), 80);
  const reason = str(formData.get("reason"), 40);
  const details = str(formData.get("details"), 600);
  if (!slug) return { error: "Something went wrong. Please try again." };
  if (!REASONS.includes(reason)) return { error: "Please choose a reason." };
  const shop = await getShopBySlug(slug);
  if (!shop) return { error: "Shop not found." };
  await createReport({ shopId: shop.id, reason, details: details || null });
  return { done: true };
}

export async function dismissReportAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = str(formData.get("reportId"), 60);
  if (id) await dismissReport(id);
  revalidatePath("/admin/reports");
}
