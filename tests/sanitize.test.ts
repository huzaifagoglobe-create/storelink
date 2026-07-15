import { describe, it, expect } from "vitest";
import { cleanRichText } from "@/server/sanitize";

describe("cleanRichText (stored-XSS prevention)", () => {
  it("strips script and event handlers", () => {
    const out = cleanRichText('<b>Hi</b><script>alert(1)</script><img src=x onerror=alert(1)>') ?? "";
    expect(out).toContain("<b>Hi</b>");
    expect(out).not.toContain("script");
    expect(out).not.toContain("onerror");
  });
  it("neutralises javascript: links but keeps safe ones", () => {
    const bad = cleanRichText('<a href="javascript:alert(1)">x</a>') ?? "";
    expect(bad).not.toContain("javascript:");
    const good = cleanRichText('<a href="https://example.com">x</a>') ?? "";
    expect(good).toContain('href="https://example.com"');
    expect(good).toContain('rel="noopener noreferrer nofollow"');
  });
  it("returns null for empty input", () => {
    expect(cleanRichText("")).toBe(null);
    expect(cleanRichText(null)).toBe(null);
  });
});
