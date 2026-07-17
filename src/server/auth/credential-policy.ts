// NOTE: no "server-only" here — the strength meter is shared with the browser so
// the seller sees the SAME verdict the server will give. The blocklists are not
// secrets; hiding them would buy nothing and would mean two rulesets that drift.

/**
 * Credential policy — sellers may choose a PIN or a password.
 *
 * Why both: a 4–6 digit PIN is fast to type on a phone (how most sellers work)
 * but has only 10,000–1,000,000 combinations. A password is slower to type but
 * far harder to guess. Rather than force one, let the seller pick — and tell
 * them honestly how strong their choice is.
 *
 * Either way we reject the guesses an attacker tries first. Rate limiting alone
 * cannot stop credential stuffing: one popular PIN tried against thousands of
 * accounts never trips a per-account limit.
 */

export type CredentialKind = "pin" | "password";
export type StrengthLevel = "weak" | "fair" | "good" | "strong";

export const PIN_RE = /^\d{4,6}$/;
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 200;

/** The PINs attackers try first. */
const COMMON_PINS = new Set([
  "1234", "1111", "0000", "1212", "7777", "1004", "2000", "4444", "2222", "6969",
  "9999", "3333", "5555", "6666", "1122", "1313", "8888", "4321", "2001", "1010",
  "2580", "0852", "1998", "1999", "2020", "2021", "2022", "2023", "2024", "2025",
  "1379", "1470", "7410", "0007", "1230", "4567", "6789", "9876", "5678",
  "123456", "111111", "000000", "121212", "654321", "666666", "123123", "112233",
  "159753", "121314", "789456", "999999", "888888", "101010", "202020",
]);

/** Passwords at the top of every leaked-password list (plus local favourites). */
const COMMON_PASSWORDS = new Set([
  "password", "password1", "password123", "12345678", "123456789", "qwerty123",
  "qwertyuiop", "1q2w3e4r", "letmein", "welcome", "admin123", "iloveyou",
  "abc12345", "monkey123", "football", "baseball", "sunshine", "princess",
  "dragon123", "master123", "trustno1", "whatever", "pakistan", "pakistan123",
  "karachi123", "lahore123", "islamabad", "allah123", "muhammad", "storelink",
  "storelink123", "changeme", "secret123", "passw0rd", "p@ssw0rd", "qwerty12345",
]);

function allSameChar(v: string): boolean {
  return new Set(v.split("")).size === 1;
}

function isRun(v: string): boolean {
  if (v.length < 3) return false;
  const c = v.split("").map((x) => x.charCodeAt(0));
  let up = true;
  let down = true;
  for (let i = 1; i < c.length; i++) {
    if (c[i] !== c[i - 1] + 1) up = false;
    if (c[i] !== c[i - 1] - 1) down = false;
  }
  return up || down;
}

function looksLikeYear(pin: string): boolean {
  if (pin.length !== 4) return false;
  const n = Number(pin);
  return n >= 1900 && n <= 2099;
}

// ─── PIN ────────────────────────────────────────────────────────────────────

/** Error message if a PIN is too easy to guess, else null. */
export function weakPinError(pin: string): string | null {
  if (COMMON_PINS.has(pin))
    return "That PIN is one of the most common ones people use, so it's easy to guess. Please pick a different one.";
  if (allSameChar(pin))
    return "A PIN of all the same digit is easy to guess. Please pick a different one.";
  if (isRun(pin))
    return "PINs in a straight run (like 1234 or 8765) are easy to guess. Please pick a different one.";
  if (looksLikeYear(pin))
    return "A PIN that looks like a year is easy to guess. Please pick a different one.";
  return null;
}

// ─── Password ───────────────────────────────────────────────────────────────

/** Error message if a password is unusable or too easy to guess, else null. */
export function weakPasswordError(pw: string): string | null {
  if (pw.length < PASSWORD_MIN) return `Your password needs at least ${PASSWORD_MIN} characters.`;
  if (pw.length > PASSWORD_MAX) return "That password is too long.";
  if (COMMON_PASSWORDS.has(pw.toLowerCase()))
    return "That password is one of the most common ones people use, so it's easy to guess. Please pick a different one.";
  if (allSameChar(pw)) return "A password of one repeated character is easy to guess.";
  if (isRun(pw.toLowerCase())) return "A password in a straight run (like abcdefgh) is easy to guess.";
  if (/^\d+$/.test(pw))
    return "A password of only numbers is easy to guess. Add some letters, or choose a PIN instead.";
  return null;
}

// ─── Strength meter (same code runs in the browser and on the server) ───────

export type Strength = { level: StrengthLevel; score: number; hint: string };

/** Score a credential 0–4 and say why, in plain words. */
export function strengthOf(value: string, kind: CredentialKind): Strength {
  if (!value) return { level: "weak", score: 0, hint: "" };

  if (kind === "pin") {
    if (!PIN_RE.test(value)) return { level: "weak", score: 0, hint: "Use 4 to 6 digits." };
    if (weakPinError(value)) return { level: "weak", score: 1, hint: "Too easy to guess — pick another." };
    if (value.length === 4) return { level: "fair", score: 2, hint: "OK. A 6-digit PIN is much safer." };
    if (value.length === 5) return { level: "good", score: 3, hint: "Good. 6 digits is safest." };
    return { level: "strong", score: 4, hint: "Strong for a PIN." };
  }

  if (value.length < PASSWORD_MIN)
    return { level: "weak", score: 0, hint: `At least ${PASSWORD_MIN} characters.` };
  if (weakPasswordError(value))
    return { level: "weak", score: 1, hint: "Too easy to guess — pick another." };

  let s = 0;
  if (value.length >= 8) s++;
  if (value.length >= 12) s++;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) s++;
  if (/\d/.test(value)) s++;
  if (/[^A-Za-z0-9]/.test(value)) s++;

  if (s <= 2) return { level: "fair", score: 2, hint: "Add length, capitals or a number." };
  if (s === 3) return { level: "good", score: 3, hint: "Good. Longer is even better." };
  if (s === 4) return { level: "good", score: 3, hint: "Good. Add a symbol to make it strong." };
  return { level: "strong", score: 4, hint: "Strong password." };
}

/** One validator for whichever kind the seller chose. */
export function credentialError(value: string, kind: CredentialKind): string | null {
  if (kind === "pin") {
    if (!PIN_RE.test(value)) return "Your PIN must be 4 to 6 digits.";
    return weakPinError(value);
  }
  return weakPasswordError(value);
}
