import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { join } from "path";

// Staff logins (the Team feature) must never be able to perform owner-only
// actions — deleting the shop, or changing payout/CNIC details. Hiding the UI
// is not enough: a Server Action is a POST endpoint whose id ships in the
// browser bundle. These checks assert the SERVER guards are present, so the
// protection can't be silently removed by a later edit.

const read = (p: string) => readFileSync(join(process.cwd(), p), "utf8");

describe("owner-only server guards", () => {
  it("requireOwner() exists and refuses staff", () => {
    const s = read("src/server/auth/current-seller.ts");
    expect(s).toMatch(/export async function requireOwner/);
    expect(s).toMatch(/isOwner/);
    expect(s).toMatch(/redirect\(/);
  });

  it("deleteAccountAction is owner-only", () => {
    const s = read("src/server/actions/account-actions.ts");
    expect(s, "delete must call requireOwner").toMatch(/requireOwner\(\)/);
  });

  it("submitVerificationAction (payout + CNIC) is owner-only", () => {
    const s = read("src/server/actions/verification-actions.ts");
    expect(s).toMatch(/requireOwner\(\)/);
  });

  it("owner-only pages are marked ownerOnly in the nav", () => {
    const s = read("src/components/dashboard/nav.tsx");
    // verification, team, and plan must all be owner-only
    for (const label of ['label: "Team"', 'label: "Plan"', 'label: "Verification"']) {
      const idx = s.indexOf(label);
      expect(idx, `${label} present`).toBeGreaterThan(-1);
      const line = s.slice(idx, idx + 200);
      expect(line, `${label} must be ownerOnly`).toMatch(/ownerOnly:\s*true/);
    }
  });
});
