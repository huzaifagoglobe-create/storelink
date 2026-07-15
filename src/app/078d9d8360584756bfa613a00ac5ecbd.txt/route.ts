// IndexNow verification file. Bing checks {SITE_URL}/{key}.txt contains this key.
// See src/server/indexnow.ts for the ping helper. Key can be overridden with
// INDEXNOW_KEY env var — if you change it, rename this folder to match.
export const dynamic = "force-static";

export function GET() {
  return new Response("078d9d8360584756bfa613a00ac5ecbd", {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
