export type RangeKey = "1" | "3" | "7" | "10" | "30" | "custom" | "all";

export interface ResolvedRange {
  start: Date | null;
  end: Date | null;
  key: RangeKey;
  label: string;
}

const PRESET_DAYS: Record<string, number> = { "1": 1, "3": 3, "7": 7, "10": 10, "30": 30 };

export function resolveRange(p: { range?: string; from?: string; to?: string }): ResolvedRange {
  if (p.from || p.to) {
    const start = p.from ? new Date(p.from + "T00:00:00") : null;
    const end = p.to ? new Date(p.to + "T23:59:59") : null;
    return { start, end, key: "custom", label: `${p.from || "start"} → ${p.to || "today"}` };
  }
  if (p.range && PRESET_DAYS[p.range]) {
    const days = PRESET_DAYS[p.range];
    const start = new Date();
    start.setDate(start.getDate() - days);
    start.setHours(0, 0, 0, 0);
    return { start, end: null, key: p.range as RangeKey, label: `Last ${days} days` };
  }
  return { start: null, end: null, key: "all", label: "All time" };
}

export function inRange(iso: string, start: Date | null, end: Date | null): boolean {
  const t = new Date(iso).getTime();
  if (start && t < start.getTime()) return false;
  if (end && t > end.getTime()) return false;
  return true;
}
