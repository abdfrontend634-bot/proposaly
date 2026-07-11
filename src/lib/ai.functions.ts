import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const FREE_MONTHLY_LIMIT = 5;

const Input = z.object({
  jobDescription: z.string().trim().min(20).max(8000),
  platform: z.enum(["Upwork", "Fiverr", "Freelancer"]),
  tone: z.enum(["Professional", "Friendly", "Confident"]),
});

export const generateProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => Input.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    // Enforce monthly free-plan limit (calendar month)
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);

    const { count, error: countErr } = await supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString());

    if (countErr) throw new Error(countErr.message);
    if ((count ?? 0) >= FREE_MONTHLY_LIMIT) {
      throw new Error(`FREE_LIMIT_REACHED:${FREE_MONTHLY_LIMIT}`);
    }

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("Missing LOVABLE_API_KEY");

    const system = `You are an elite freelance proposal writer. Produce concise, high-converting proposals tailored to the platform.

Rules:
- Open with a specific hook that references the client's problem (no "Dear Sir/Madam", no "I hope this finds you well").
- 3 short paragraphs max, plus a compact bullet list of 3 relevant capabilities.
- End with a clear, low-friction call to action (question or next step).
- Match the requested tone precisely.
- Never invent credentials, prices, or timelines the client didn't ask about.
- Plain text only, no markdown headings, no emojis.
- Length: 140–220 words.`;

    const user = `Platform: ${data.platform}
Tone: ${data.tone}

Job posting:
"""
${data.jobDescription}
"""

Write the proposal now.`;

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      if (resp.status === 429) throw new Error("AI rate limit — try again in a moment.");
      if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits in Lovable Cloud.");
      throw new Error(`AI error (${resp.status}): ${text.slice(0, 200)}`);
    }

    const json = (await resp.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) throw new Error("Empty AI response");

    // Record generation
    await supabase.from("generations").insert({ user_id: userId });

    const { count: newCount } = await supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString());

    return {
      content,
      usage: { used: newCount ?? 0, limit: FREE_MONTHLY_LIMIT },
    };
  });

export const getUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const monthStart = new Date();
    monthStart.setUTCDate(1);
    monthStart.setUTCHours(0, 0, 0, 0);
    const { count } = await context.supabase
      .from("generations")
      .select("id", { count: "exact", head: true })
      .gte("created_at", monthStart.toISOString());
    return { used: count ?? 0, limit: FREE_MONTHLY_LIMIT };
  });
