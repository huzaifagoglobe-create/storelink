import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("free mode consistency", () => {
  // The dashboard badge said "Free trial plan" while every other surface said
  // the product was free — implying a countdown that does not exist.
  it("the dashboard plan badge respects FREE_MODE", () => {
    const s = read("src/app/dashboard/page.tsx");
    expect(s).toMatch(/FREE_MODE \? FREE_MODE_LABEL/);
  });

  // A promo code buys extra TRIAL days, which is meaningless while free.
  it("the signup promo field does not promise a longer trial while free", () => {
    const s = read("src/components/dashboard/signup-form.tsx");
    expect(s).toMatch(/FREE_MODE \?/);
    const i = s.indexOf('name="promo"');
    expect(i).toBeGreaterThan(-1);
    const near = s.slice(i - 400, i + 400);
    expect(near, "promo placeholder must be FREE_MODE-aware").toMatch(/FREE_MODE/);
  });

  it("FREE_MODE is a single server-side switch, not client-controlled", () => {
    const s = read("src/server/plans.ts");
    expect(s).toMatch(/export const FREE_MODE = process\.env\.NEXT_PUBLIC_FREE_MODE !== "0"/);
  });
});

describe("demo credential exposure", () => {
  // The login page advertised admin@shop.pk / PIN 4321 to every visitor,
  // unconditionally — including on a live site where those accounts do not
  // exist. It must only appear when there is no real database.
  it("demo logins are only shown when no database is configured", () => {
    const s = read("src/app/login/page.tsx");
    expect(s).toMatch(/isSupabaseConfigured/);
    const i = s.indexOf("Demo logins");
    expect(i).toBeGreaterThan(-1);
    const before = s.slice(Math.max(0, i - 400), i);
    expect(before, "the demo box must be behind !isSupabaseConfigured()").toMatch(
      /!isSupabaseConfigured\(\)\s*&&/
    );
  });
});
