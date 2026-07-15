import "server-only";
import { SITE_URL } from "@/lib/site";

// IndexNow: pings Bing (and other participating engines) the moment a page
// changes, instead of waiting for them to discover it. This matters because
// ChatGPT's live web search runs on Bing's index — a shop/product won't be
// findable there until Bing has crawled it.
// Key must match the value served at /{key}.txt (see that route).
const INDEXNOW_KEY = process.env.INDEXNOW_KEY || "078d9d8360584756bfa613a00ac5ecbd";
const INDEXNOW_KEY_LOCATION = `${SITE_URL}/${INDEXNOW_KEY}.txt`;

/**
 * Notify IndexNow that one or more URLs changed. Fire-and-forget — never
 * throws, never blocks the caller, and does nothing on localhost (search
 * engines can't reach it anyway).
 */
export function pingIndexNow(urls: string | string[]): void {
  const list = (Array.isArray(urls) ? urls : [urls]).filter(Boolean);
  if (list.length === 0) return;
  if (!SITE_URL || SITE_URL.includes("localhost")) return;

  const host = new URL(SITE_URL).host;
  fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: INDEXNOW_KEY_LOCATION, urlList: list }),
  }).catch((e) => {
    console.error("pingIndexNow:", e instanceof Error ? e.message : e);
  });
}
