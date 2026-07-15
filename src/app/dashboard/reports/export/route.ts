import { requireSeller } from "@/server/auth/current-seller";
import { listShopOrders } from "@/server/services/order-service";
import { resolveRange, inRange } from "@/lib/date-range";

function esc(v: unknown): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET(req: Request) {
  const { shop } = await requireSeller();
  const url = new URL(req.url);
  const { start, end } = resolveRange({
    range: url.searchParams.get("range") ?? undefined,
    from: url.searchParams.get("from") ?? undefined,
    to: url.searchParams.get("to") ?? undefined,
  });
  const orders = (await listShopOrders(shop.id)).filter((o) => inRange(o.createdAt, start, end));

  const header = ["Order #", "Date", "Customer", "Phone", "Email", "City", "Status", "Payment", "Total"];
  const rows = orders.map((o) => [
    o.id,
    new Date(o.createdAt).toISOString().slice(0, 10),
    o.customerName,
    o.customerPhone,
    o.customerEmail ?? "",
    o.city ?? "",
    o.status,
    o.paymentMethod,
    o.total,
  ]);
  const csv = [header, ...rows].map((r) => r.map(esc).join(",")).join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="sales-report.csv"',
    },
  });
}
