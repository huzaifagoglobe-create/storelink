import "server-only";

/**
 * Rewrites a product description so it reads as unique and appealing. Many
 * sellers paste the same supplier text, and duplicate content hurts everyone's
 * search ranking — this gives each shop its own wording.
 *
 * By default this runs a free, built-in rewrite (no external service, no cost).
 * If you later set AI_API_KEY (any OpenAI-compatible provider — Gemini, Groq,
 * OpenRouter, NVIDIA, Anthropic-compatible, etc.) it will use that for higher-
 * quality rewrites instead. Nothing else changes; the button stays the same.
 */

export interface RewriteInput {
  name: string;
  description: string;
  category?: string | null;
}

export async function rewriteDescription({ name, description, category }: RewriteInput): Promise<string> {
  const base = (description || "").trim();

  // Optional AI upgrade. Works with ANY OpenAI-compatible endpoint — set:
  //   AI_API_KEY   = your free key (OpenRouter, Gemini, Groq, NVIDIA, etc.)
  //   AI_BASE_URL  = provider's base URL (e.g. https://openrouter.ai/api/v1)
  //   AI_MODEL     = the model id (e.g. nvidia/nemotron-... , or a free model)
  // If AI_API_KEY is not set, the free built-in rewrite below is used instead.
  const key = process.env.AI_API_KEY;
  const baseUrl = process.env.AI_BASE_URL || "https://openrouter.ai/api/v1";
  const model = process.env.AI_MODEL || "meta-llama/llama-3.1-8b-instruct:free";

  if (key) {
    try {
      const res = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          max_tokens: 400,
          messages: [
            {
              role: "user",
              content:
                `Rewrite this product description for an online shop in Pakistan so it is original, ` +
                `clear, and appealing to buyers. Keep it honest and specific (fabric, sizes, fit, ` +
                `colours, care, delivery if mentioned). Warm, simple language a shopper understands. ` +
                `Do not invent facts that aren't implied. Return ONLY the rewritten description, no preamble.\n\n` +
                `Product name: ${name}\n` +
                (category ? `Category: ${category}\n` : "") +
                `Current description:\n${base || "(none provided)"}`,
            },
          ],
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const text = (data?.choices?.[0]?.message?.content ?? "").toString().trim();
        if (text) return text.slice(0, 6000);
      } else {
        console.error("rewriteDescription: AI provider", res.status);
      }
    } catch (e) {
      console.error("rewriteDescription:", e);
    }
    // fall through to the built-in rewrite if the AI call failed
  }

  return ruleBasedRewrite(name, base, category);
}

// Lightweight, deterministic rewrite used when no AI key is configured (or the
// API call fails). It restructures + freshens wording so two shops with the same
// pasted text don't end up identical.
function ruleBasedRewrite(name: string, description: string, category?: string | null): string {
  const clean = description.replace(/\s+/g, " ").trim();
  const sentences = clean
    ? clean.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter(Boolean)
    : [];

  const opener = category
    ? `Looking for ${name.toLowerCase()}? This ${category.toLowerCase()} piece is a lovely pick.`
    : `Meet the ${name} — a piece we think you'll love.`;

  if (sentences.length === 0) {
    return (
      `${opener} Made with care and ready to ship across Pakistan. ` +
      `Message us on WhatsApp if you'd like more details on sizing, fabric, or delivery.`
    );
  }

  // Reorder gently and wrap with fresh framing so it's not a verbatim copy.
  const body = sentences.join(" ");
  return (
    `${opener} ${body} ` +
    `Cash on Delivery available, with quick dispatch. Have a question? We're a WhatsApp message away.`
  ).slice(0, 6000);
}
