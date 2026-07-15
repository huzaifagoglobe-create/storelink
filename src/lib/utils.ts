// Tiny className joiner (keeps components tidy without an extra dependency).
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}
