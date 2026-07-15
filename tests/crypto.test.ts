import { describe, it, expect } from "vitest";
import { encryptField, decryptField } from "@/server/crypto";

describe("field encryption", () => {
  it("round-trips a value", () => {
    const enc = encryptField("4210112345671");
    expect(enc).toMatch(/^enc:v1:/);
    expect(decryptField(enc)).toBe("4210112345671");
  });
  it("passes plaintext/empty through unchanged", () => {
    expect(decryptField("plain-legacy")).toBe("plain-legacy");
    expect(encryptField("")).toBe(null);
    expect(decryptField(null)).toBe(null);
  });
  it("detects tampering", () => {
    const enc = encryptField("secret-account") as string;
    const tampered = enc.slice(0, -4) + "AAAA";
    expect(decryptField(tampered)).toBe("••••");
  });
});
