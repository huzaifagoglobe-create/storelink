import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/server/auth/password";

describe("password hashing", () => {
  it("verifies a correct PIN and salts uniquely", () => {
    const a = hashPassword("1234");
    const b = hashPassword("1234");
    expect(a).not.toEqual(b); // different salt each time
    expect(verifyPassword("1234", a)).toBe(true);
    expect(verifyPassword("1234", b)).toBe(true);
  });
  it("rejects a wrong PIN and garbage hashes", () => {
    const h = hashPassword("4321");
    expect(verifyPassword("0000", h)).toBe(false);
    expect(verifyPassword("4321", "not-a-hash")).toBe(false);
    expect(verifyPassword("4321", "")).toBe(false);
  });
});
