// Currency formatting. PKR shows as "Rs 4,500".
export function formatCurrency(amount: number, currency = "PKR"): string {
  const n = new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(
    Math.round(amount)
  );
  return currency === "PKR" ? `Rs ${n}` : `${currency} ${n}`;
}
