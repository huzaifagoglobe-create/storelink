import "server-only";

export function str(v: FormDataEntryValue | null, max = 1000): string {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}
export function optStr(v: FormDataEntryValue | null, max = 1000): string | null {
  const s = str(v, max);
  return s ? s : null;
}
export function num(v: FormDataEntryValue | null): number {
  const s = typeof v === "string" ? v.replace(/,/g, "").trim() : "";
  return s === "" ? NaN : Number(s);
}
export function optNum(v: FormDataEntryValue | null): number | null {
  const s = typeof v === "string" ? v.replace(/,/g, "").trim() : "";
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
export function bool(v: FormDataEntryValue | null): boolean {
  return v === "on" || v === "true" || v === "1";
}
export function normalizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}
export function normalizePhone(raw: string): string {
  let d = (raw ?? "").replace(/\D/g, "");
  if (d.startsWith("0")) d = "92" + d.slice(1); // 03xx... -> 923xx...
  return d;
}
