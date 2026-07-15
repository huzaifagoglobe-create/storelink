import type { OrderStatus } from "@/server/types";

const map: Record<OrderStatus, { label: string; cls: string }> = {
  new: { label: "New", cls: "bg-[#E7EEFB] text-[#2b4a86]" },
  confirmed: { label: "Confirmed", cls: "bg-[#FDF1DC] text-[#8a5a16]" },
  delivered: { label: "Delivered", cls: "bg-[#DDECE3] text-[#2C6B57]" },
  cancelled: { label: "Cancelled", cls: "bg-[#ECEEED] text-[#6E7A75]" },
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  const s = map[status] ?? map.new;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      {s.label}
    </span>
  );
}
