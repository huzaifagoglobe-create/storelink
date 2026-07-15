import { describe, it, expect } from "vitest";
import { discountAmount } from "@/server/services/discount-service";
import type { Discount } from "@/server/types";

const d = (over: Partial<Discount>): Discount => ({
  id: "d1", shopId: "s1", code: "SAVE", type: "percent", value: 10,
  isActive: true, createdAt: "", ...over,
});

describe("discountAmount", () => {
  it("applies a percentage", () => {
    expect(discountAmount(1000, d({ type: "percent", value: 10 }))).toBe(100);
  });
  it("caps a fixed discount at the subtotal (never negative total)", () => {
    expect(discountAmount(500, d({ type: "fixed", value: 9999 }))).toBe(500);
  });
  it("returns 0 for inactive codes or empty carts", () => {
    expect(discountAmount(1000, d({ isActive: false }))).toBe(0);
    expect(discountAmount(0, d({}))).toBe(0);
  });
});
