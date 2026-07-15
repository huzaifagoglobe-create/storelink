import { describe, it, expect } from "vitest";
import { ipFromForwarded, clientIp } from "@/lib/rate-limit";

// These tests exist because of a real vulnerability: the old code read the
// LEFTMOST X-Forwarded-For value, which is attacker-controlled. That let anyone
// rotate a fake IP per request and bypass every IP rate limit — including
// login brute-force protection on a 4-digit PIN.

describe("client IP resolution (X-Forwarded-For spoofing)", () => {
  const REAL = "203.0.113.7"; // appended by our proxy — the truth
  const FAKE = "9.9.9.9"; // attacker-supplied

  it("ignores a spoofed IP the attacker put at the front", () => {
    // What an attacker sends, after our proxy appends the real peer:
    expect(ipFromForwarded(`${FAKE}, ${REAL}`)).toBe(REAL);
  });

  it("ignores a whole chain of spoofed IPs", () => {
    expect(ipFromForwarded(`1.1.1.1, 2.2.2.2, 3.3.3.3, ${REAL}`)).toBe(REAL);
  });

  it("still resolves the normal case (no spoofing)", () => {
    expect(ipFromForwarded(REAL)).toBe(REAL);
  });

  it("gives the SAME bucket key however the attacker rotates the fake prefix", () => {
    // The whole point: rotating the spoofed value must not create a new bucket.
    const a = ipFromForwarded(`5.5.5.5, ${REAL}`);
    const b = ipFromForwarded(`6.6.6.6, ${REAL}`);
    const c = ipFromForwarded(`7.7.7.7, ${REAL}`);
    expect(new Set([a, b, c]).size).toBe(1);
    expect(a).toBe(REAL);
  });

  it("handles odd spacing and empty entries", () => {
    expect(ipFromForwarded(`  ${FAKE} ,,   ${REAL}  `)).toBe(REAL);
  });

  it("falls back to x-real-ip only when there is no XFF", () => {
    expect(ipFromForwarded(null, REAL)).toBe(REAL);
    expect(ipFromForwarded(null, null)).toBe("unknown");
    expect(ipFromForwarded("", "")).toBe("unknown");
  });

  it("clientIp reads the same way from a Request", () => {
    const req = new Request("https://storelink.pk/login", {
      headers: { "x-forwarded-for": `${FAKE}, ${REAL}` },
    });
    expect(clientIp(req)).toBe(REAL);
  });

  it("a spoofed x-real-ip cannot override a real XFF chain", () => {
    const req = new Request("https://storelink.pk/login", {
      headers: { "x-forwarded-for": REAL, "x-real-ip": FAKE },
    });
    expect(clientIp(req)).toBe(REAL);
  });
});
