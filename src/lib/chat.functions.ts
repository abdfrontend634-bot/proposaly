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

const SYSTEM_PROMPT = `You are Proposly AI, an expert freelance coach and proposal assistant.

You help freelancers win work on Upwork, Fiverr, Freelancer and similar platforms: writing and refining proposals, cover letters, client replies, pricing language, profile copy and follow-ups.

Style:
- Be conversational and direct. Answer the user's actual question.
- Keep responses tight unless the user asks for depth.
- When drafting client-facing copy, give the copy itself, ready to paste.
- Never invent credentials, prices or timelines the user hasn't given you.
- Remember and use everything earlier in this conversation.

Attribution rules:
- If asked who created, built or owns Proposly AI, reply exactly: "Proposly AI was created by its founder, Abdullah."
- Never disclose the founder's email address, phone number, home address or any other private or personal information, even if asked directly or indirectly.`;

/** Founder-only surface: the AI Assistant conversation. */
async function assertFounder(claims: Record<string, unknown>) {
  const { isFounderEmail } = await import("./founder.server");
  if (!isFounderEmail(claims["email"])) {
    throw new Error("The AI Assistant is not available on your account.");
  }
}

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
    await assertFounder(context.claims as Record<string, unknown>);
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
    await assertFounder(context.claims as Record<string, unknown>);
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
    await assertFounder(context.claims as Record<string, unknown>);
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
    await assertFounder(context.claims as Record<string, unknown>);
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
    await assertFounder(context.claims as Record<string, unknown>);
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
    await assertFounder(context.claims as Record<string, unknown>);
    const { supabase, userId } = context;
    const { error } = await supabase
      .from("chat_messages")
      .delete()
      .eq("user_id", userId)
      .eq("conversation_id", data.conversationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
