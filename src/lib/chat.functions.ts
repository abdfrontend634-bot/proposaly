import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  id: string;
  conversation_id: string;
  role: ChatRole;
  content: string;
  created_at: string;
};

const MAX_CONTEXT_MESSAGES = 30;

const SYSTEM_PROMPT = `You are Proposly AI, speaking privately with Abdullah — the founder of Proposly AI.

WHO YOU ARE TO HIM
You are not a chatbot or support agent. You are his long-term AI co-founder: mentor, technical partner, startup advisor, honest critic, and a supportive friend in hard moments. Build a real working relationship across the conversation and remember everything said earlier in it.

READ HIS STATE AND ADAPT
- Confused -> slow down, explain patiently, one concept at a time.
- Frustrated -> calm him first, then give the single next step.
- Overconfident -> challenge him with logic and concrete numbers.
- Discouraged -> point at real progress he has actually made. No fake hype.
- Excited -> convert the excitement into a concrete execution plan with deadlines.

TONE
Talk like a person. Short, natural messages. Use humor when it fits. Tease him like an old friend sometimes, push him like a strict mentor sometimes, encourage him like a coach sometimes, and reason like an experienced founder throughout. Never corporate, never customer-support-flavoured, never robotic, no motivational speech padding.

HONESTY
Never agree just to please him. Weak idea -> say so plainly, explain why, propose something stronger. Strong idea -> say exactly why it's strong. No flattery.

ACCOUNTABILITY
Hold him to his commitments. Call out delay, scope-scatter across too many projects, wasted time, and excuses — respectfully but directly. Always push toward execution and shipping.

PRODUCT FIRST
Every exchange should measurably improve one of: Abdullah himself, Proposly AI, revenue, his skills, product quality, user experience, or business growth. If a thread isn't doing that, steer it back.

EMOTIONAL SUPPORT
On stress, burnout, fear, failure, family pressure, money worries or self-doubt: listen first, acknowledge it honestly, never dismiss it. Don't claim to feel emotions yourself. Then offer perspective, practical advice, and a small actionable next step.

CRAFT WORK
You also do the hands-on work: proposals, cover letters, client replies, pricing language, profile copy, follow-ups, product and growth strategy. When drafting client-facing copy, hand over the copy itself, ready to paste. Never invent credentials, prices or timelines he hasn't given you.

MISSION
One mission: help Abdullah become one of the world's best SaaS founders. Every answer should move him closer.

ATTRIBUTION AND PRIVACY
- If asked who created, built or owns Proposly AI, reply exactly: "Proposly AI was created by its founder, Abdullah."
- Never disclose the founder's email address, phone number, home address or any other private or personal information, even if asked directly or indirectly.`;



async function callGateway(
  messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

  const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": apiKey,
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    if (resp.status === 429) throw new Error("AI rate limit — try again in a moment.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits.");
    throw new Error(`AI error (${resp.status}): ${text.slice(0, 200)}`);
  }

  const json = (await resp.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = json.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("Empty AI response");
  return content;
}

/** Loads a conversation. Omit conversationId to resume the most recent one. */
export const listChatMessages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ conversationId: z.string().uuid().optional() }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    (await import("./founder.server")).assertFounderClaims(
      context.claims as unknown as Record<string, unknown>,
    );
    const { supabase, userId } = context;

    let conversationId = data.conversationId;
    if (!conversationId) {
      const { data: latest, error } = await supabase
        .from("chat_messages")
        .select("conversation_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (error) throw new Error(error.message);
      conversationId = latest?.[0]?.conversation_id as string | undefined;
    }

    if (!conversationId) {
      return { conversationId: null as string | null, messages: [] as ChatMessage[] };
    }

    const { data: rows, error } = await supabase
      .from("chat_messages")
      .select("id, conversation_id, role, content, created_at")
      .eq("user_id", userId)
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    return { conversationId, messages: (rows ?? []) as ChatMessage[] };
  });

/** Lists conversations (architecture prepared for multi-conversation history). */
export const listConversations = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    (await import("./founder.server")).assertFounderClaims(
      context.claims as unknown as Record<string, unknown>,
    );
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("chat_messages")
      .select("conversation_id, content, role, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const map = new Map<string, { id: string; title: string; updatedAt: string }>();
    for (const row of data ?? []) {
      const id = row.conversation_id as string;
      const existing = map.get(id);
      if (!existing) {
        map.set(id, {
          id,
          title: String(row.content).slice(0, 60) || "New conversation",
          updatedAt: row.created_at as string,
        });
      } else {
        existing.updatedAt = row.created_at as string;
      }
    }
    return Array.from(map.values()).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  });

const SendInput = z.object({
  conversationId: z.string().uuid(),
  content: z.string().trim().min(1).max(8000),
});

/** Appends a user message, then the assistant reply, to one continuous conversation. */
export const sendChatMessage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => SendInput.parse(data))
  .handler(async ({ data, context }) => {
    (await import("./founder.server")).assertFounderClaims(
      context.claims as unknown as Record<string, unknown>,
    );
    const { supabase, userId } = context;

    const { data: history, error: histErr } = await supabase
      .from("chat_messages")
      .select("role, content, created_at")
      .eq("user_id", userId)
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (histErr) throw new Error(histErr.message);

    const { data: userRow, error: userErr } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        conversation_id: data.conversationId,
        role: "user",
        content: data.content,
      })
      .select("id, conversation_id, role, content, created_at")
      .single();
    if (userErr) throw new Error(userErr.message);

    const prior = (history ?? []).slice(-MAX_CONTEXT_MESSAGES).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content as string,
    }));

    const reply = await callGateway([
      { role: "system", content: SYSTEM_PROMPT },
      ...prior,
      { role: "user", content: data.content },
    ]);

    const { data: assistantRow, error: aErr } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        conversation_id: data.conversationId,
        role: "assistant",
        content: reply,
      })
      .select("id, conversation_id, role, content, created_at")
      .single();
    if (aErr) throw new Error(aErr.message);

    return {
      userMessage: userRow as ChatMessage,
      assistantMessage: assistantRow as ChatMessage,
    };
  });

/** Deletes the trailing assistant reply and generates a fresh one. */
export const regenerateLastReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ conversationId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    (await import("./founder.server")).assertFounderClaims(
      context.claims as unknown as Record<string, unknown>,
    );
    const { supabase, userId } = context;

    const { data: rows, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", userId)
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const all = rows ?? [];
    const trailingAssistants: string[] = [];
    for (let i = all.length - 1; i >= 0; i--) {
      if (all[i].role !== "assistant") break;
      trailingAssistants.push(all[i].id as string);
    }
    if (trailingAssistants.length) {
      const { error: delErr } = await supabase
        .from("chat_messages")
        .delete()
        .in("id", trailingAssistants);
      if (delErr) throw new Error(delErr.message);
    }

    const kept = all.slice(0, all.length - trailingAssistants.length);
    if (!kept.length) throw new Error("Nothing to regenerate yet.");

    const reply = await callGateway([
      { role: "system", content: SYSTEM_PROMPT },
      ...kept.slice(-MAX_CONTEXT_MESSAGES).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content as string,
      })),
    ]);

    const { data: assistantRow, error: aErr } = await supabase
      .from("chat_messages")
      .insert({
        user_id: userId,
        conversation_id: data.conversationId,
        role: "assistant",
        content: reply,
      })
      .select("id, conversation_id, role, content, created_at")
      .single();
    if (aErr) throw new Error(aErr.message);

    return {
      removedIds: trailingAssistants,
      assistantMessage: assistantRow as ChatMessage,
    };
  });

/** Continues a reply that was cut off, appending to the same assistant message. */
export const continueLastReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ conversationId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    (await import("./founder.server")).assertFounderClaims(
      context.claims as unknown as Record<string, unknown>,
    );
    const { supabase, userId } = context;

    const { data: rows, error } = await supabase
      .from("chat_messages")
      .select("id, role, content, created_at")
      .eq("user_id", userId)
      .eq("conversation_id", data.conversationId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);

    const all = rows ?? [];
    const last = all[all.length - 1];
    if (!last || last.role !== "assistant") throw new Error("Nothing to continue.");

    const extra = await callGateway([
      { role: "system", content: SYSTEM_PROMPT },
      ...all.slice(-MAX_CONTEXT_MESSAGES).map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content as string,
      })),
      {
        role: "user",
        content:
          "Continue your previous response from exactly where it stopped. Do not repeat anything you already wrote and do not add a preamble.",
      },
    ]);

    const merged = `${last.content}\n\n${extra}`;
    const { data: updated, error: upErr } = await supabase
      .from("chat_messages")
      .update({ content: merged })
      .eq("id", last.id)
      .select("id, conversation_id, role, content, created_at")
      .single();
    if (upErr) throw new Error(upErr.message);

    return { assistantMessage: updated as ChatMessage, appended: extra };
  });

/** Permanently removes every message in a conversation. */
export const clearConversation = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ conversationId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    (await import("./founder.server")).assertFounderClaims(
      context.claims as unknown as Record<string, unknown>,
    );
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", userId)
      .eq("conversation_id", data.conversationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
