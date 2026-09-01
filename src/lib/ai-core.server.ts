// Server-only AI Gateway helper. Never imported by client code.

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export class AiError extends Error {}

/** Calls the Lovable AI Gateway and returns the assistant text. */
export async function callAI(
  messages: ChatMessage[],
  opts: { model?: string; temperature?: number } = {},
): Promise<string> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiError("The AI service isn't configured yet. Please try again later.");

  const resp = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: opts.model ?? "google/gemini-3-flash-preview",
      ...(opts.temperature !== undefined ? { temperature: opts.temperature } : {}),
      messages,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    if (resp.status === 429)
      throw new AiError("The AI is handling a lot of requests right now. Try again in a few seconds.");
    if (resp.status === 402)
      throw new AiError("AI credits are exhausted. Add credits to keep generating.");
    console.error(`[AI] ${resp.status} ${text.slice(0, 400)}`);
    throw new AiError("The AI couldn't finish that request. Please try again.");
  }

  const json = (await resp.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new AiError("The AI returned an empty response. Please try again.");
  return content;
}

/** Parses a JSON object out of a model response, tolerating code fences and prose. */
export function parseJsonObject<T>(raw: string): T | null {
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(cleaned.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/** Shared honesty rules used across every proposal-related prompt. */
export const HONESTY_RULES = `Hard rules you must never break:
- Never invent experience, clients, metrics, prices, timelines, certifications, or portfolio work. Use only facts supplied to you.
- If a fact is missing, write around it or leave a clearly marked placeholder like [your rate] instead of guessing.
- No fake statistics, no guarantees, no "10x" claims.
- No emojis, no markdown headings, no "I hope this email finds you well".`;
