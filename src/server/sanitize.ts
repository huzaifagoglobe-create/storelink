import "server-only";
import sanitizeHtml from "sanitize-html";

// Allowlist for seller-written product descriptions. Anything outside this is
// stripped, so a description can never carry <script>, event handlers, iframes,
// javascript: links, etc. This runs on SAVE, so what's stored is already safe.
export function cleanRichText(input: string | null | undefined): string | null {
  if (!input) return null;
  const clean = sanitizeHtml(input, {
    allowedTags: ["b", "strong", "i", "em", "u", "h3", "p", "br", "ul", "ol", "li", "a", "span"],
    allowedAttributes: { a: ["href", "target", "rel"] },
    allowedSchemes: ["http", "https", "mailto"],
    allowedSchemesAppliedToAttributes: ["href"],
    transformTags: {
      a: (tagName, attribs) => ({
        tagName: "a",
        attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer nofollow" },
      }),
    },
    disallowedTagsMode: "discard",
  }).trim();
  return clean || null;
}
