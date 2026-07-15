import { describe, it, expect } from "vitest";
import { weakPinError } from "@/server/auth/pin-policy";

describe("weak PIN policy", () => {
  it("rejects the PINs attackers try first", () => {
    for (const pin of ["1234", "1111", "0000", "1212", "7777", "4321", "1122"]) {
      expect(weakPinError(pin), `${pin} should be rejected`).toBeTruthy();
    }
  });

  it("rejects all-same-digit PINs", () => {
    for (const pin of ["3333", "999999", "55555"]) {
      expect(weakPinError(pin), `${pin} should be rejected`).toBeTruthy();
    }
  });

  it("rejects straight runs, both directions", () => {
    for (const pin of ["2345", "3456", "9876", "543210".slice(0, 5)]) {
      expect(weakPinError(pin), `${pin} should be rejected`).toBeTruthy();
    }
  });

  it("rejects PINs that look like a year", () => {
    for (const pin of ["1990", "2024", "1987"]) {
      expect(weakPinError(pin), `${pin} should be rejected`).toBeTruthy();
    }
  });

  it("allows a reasonable PIN", () => {
    for (const pin of ["8317", "5092", "4826", "739184"]) {
      expect(weakPinError(pin), `${pin} should be allowed`).toBeNull();
    }
  });

  it("gives a message a seller can understand (no jargon)", () => {
    const msg = weakPinError("1234")!;
    expect(msg).toMatch(/easy to guess/i);
    expect(msg).not.toMatch(/entropy|brute|hash/i);
  });
});
