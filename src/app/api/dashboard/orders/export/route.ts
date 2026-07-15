import { getCurrentSeller } from "@/server/auth/current-seller";
import { listShopOrders } from "@/server/services/order-service";

function csvCell(v: string | number): string {
  let s = String(v ?? "");
  // Neutralise spreadsheet formula injection: a leading = + - @ (or tab/CR)
  // can execute when the seller opens the CSV in Excel/Sheets.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export async function GET() {
  const seller = await getCurrentSeller();
  if (!seller) return new Response("Unauthorized", { status: 401 });
  const orders = await listShopOrders(seller.shop.id);
  const header = [
    "Order", "Date", "Customer", "Phone", "Address", "City",
    "Payment", "Status", "Subtotal", "Discount", "Delivery", "Total",
  ];
  const rows = orders.map((o) => [
    o.id, o.createdAt, o.customerName, o.customerPhone, o.address, o.city,
    o.paymentMethod, o.status, o.subtotal, o.discount, o.deliveryFee, o.total,
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\n");
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${seller.shop.slug}.csv"`,
    },
  });
}
