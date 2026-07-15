import "server-only";

/**
 * PIN policy.
 *
 * A 4-digit PIN has only 10,000 combinations, and real users do not pick them
 * evenly — a small handful of PINs cover a large share of all choices. That
 * makes "credential stuffing" cheap: an attacker tries ONE popular PIN against
 * thousands of accounts, and the per-account rate limit never trips because
 * each account only sees a single attempt.
 *
 * Rate limiting cannot fix that on its own. Refusing the popular PINs can.
 *
 * We reject:
 *   · the well-known most-common PINs (1234, 1111, 0000, …)
 *   · every "all same digit" PIN (1111, 22222, …)
 *   · straight runs, up and down (2345, 8765, …)
 *   · obvious years people pick (19xx / 20xx)
 *
 * This is deliberately a blocklist, not a strength meter: the goal is to remove
 * the cheap guesses without making a simple product annoying for sellers.
 */

/** The PINs attackers try first. Sourced from well-known 4-digit PIN analyses. */
const COMMON_PINS = new Set([
  "1234", "1111", "0000", "1212", "7777", "1004", "2000", "4444", "2222", "6969",
  "9999", "3333", "5555", "6666", "1122", "1313", "8888", "4321", "2001", "1010",
  "1004", "2580", "0852", "1998", "1999", "2020", "2021", "2022", "2023", "2024",
  "2025", "1379", "1470", "7410", "0007", "1230", "4567", "6789", "9876", "5678",
  "123456", "111111", "000000", "121212", "654321", "666666", "123123", "112233",
  "159753", "121314", "789456", "999999", "888888", "101010", "202020",
]);

function allSameDigit(pin: string): boolean {
  return new Set(pin.split("")).size === 1;
}

function isRun(pin: string): boolean {
  const d = pin.split("").map(Number);
  let up = true;
  let down = true;
  for (let i = 1; i < d.length; i++) {
    if (d[i] !== d[i - 1] + 1) up = false;
    if (d[i] !== d[i - 1] - 1) down = false;
  }
  return up || down;
}

function looksLikeYear(pin: string): boolean {
  if (pin.length !== 4) return false;
  const n = Number(pin);
  return (n >= 1900 && n <= 2099);
}

/**
 * Returns an error message if the PIN is too easy to guess, or null if it's OK.
 * The message is written for a seller, not a security engineer.
 */
export function weakPinError(pin: string): string | null {
  if (COMMON_PINS.has(pin)) {
    return "That PIN is one of the most common ones people use, so it's easy to guess. Please pick a different one.";
  }
  if (allSameDigit(pin)) {
    return "A PIN of all the same digit is easy to guess. Please pick a different one.";
  }
  if (isRun(pin)) {
    return "PINs in a straight run (like 1234 or 8765) are easy to guess. Please pick a different one.";
  }
  if (looksLikeYear(pin)) {
    return "A PIN that looks like a year is easy to guess. Please pick a different one.";
  }
  return null;
}
