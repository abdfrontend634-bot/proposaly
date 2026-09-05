import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const FREE_MONTHLY_LIMIT = 50;

export const PLATFORMS = ["Upwork", "Fiverr", "Freelancer", "LinkedIn", "Direct client"] as const;
export const TONES = ["Professional", "Friendly", "Confident", "Concise", "Technical"] as const;
export const LENGTHS = ["Short", "Standard", "Detailed"] as const;

export const REFINE_ACTIONS = [
  "Improve opening",
  "More convincing",
  "More natural",
  "Shorten",
  "Expand",
  "Simplify",
  "More technical",
  "Add relevant portfolio",
] as const;

export type JobAnalysis = {
  projectType: string;
  summary: string;
  clientNeeds: string[];
  requiredSkills: string[];
  technologies: string[];
  deliverables: string[];
  priorities: string[];
  concerns: string[];
  keywords: string[];
  decisionFactors: string[];
  /** Which of the user's saved skills/technologies genuinely fit, and what the posting asks for that they haven't saved. */
  skillMatch?: { strengths: string[]; gaps: string[] };
};

export type PortfolioMatch = { id: string; name: string; reason: string };

export type ProposalScore = {
  overall: number;
  dimensions: Array<{ name: string; score: number; note: string }>;
  recommendations: string[];
};

const activeStatuses = ["active", "trialing", "past_due"];

async function isPro(supabase: any, userId: string) {
  const { data, error } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error("Couldn't check your plan. Please refresh and try again.");
  return !!data && activeStatuses.includes(data.status);
}

function monthStartIso() {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

async function countThisMonth(supabase: any, userId: string) {
  const { count, error } = await supabase
    .from("generations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", monthStartIso());
  if (error) throw new Error("Couldn't read your usage. Please refresh and try again.");
  return count ?? 0;
}

/** Throws a machine-readable limit error for non-pro users at the cap. */
async function assertQuota(supabase: any, userId: string) {
  const pro = await isPro(supabase, userId);
  if (pro) return { pro };
  const used = await countThisMonth(supabase, userId);
  if (used >= FREE_MONTHLY_LIMIT) throw new Error(`FREE_LIMIT_REACHED:${FREE_MONTHLY_LIMIT}`);
  return { pro };
}

async function loadContext(supabase: any, userId: string) {
  const [profileRes, portfolioRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase
      .from("portfolio_items")
      .select("id, name, description, role, technologies, services, results, url")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(40),
  ]);
  return {
    profile: profileRes.data ?? null,
    portfolio: (portfolioRes.data ?? []) as Array<Record<string, unknown>>,
  };
}

function profileBlock(profile: Record<string, any> | null) {
  if (!profile) return "Freelancer profile: not provided. Do not invent one.";
  const parts = [
    profile.display_name && `Name: ${profile.display_name}`,
    profile.professional_title && `Title: ${profile.professional_title}`,
    profile.experience && `Experience: ${profile.experience}`,
    profile.skills?.length && `Skills: ${profile.skills.join(", ")}`,
    profile.services?.length && `Services: ${profile.services.join(", ")}`,
    profile.technologies?.length && `Technologies: ${profile.technologies.join(", ")}`,
    profile.availability && `Availability: ${profile.availability}`,
    profile.bio && `Bio: ${profile.bio}`,
    profile.signature && `Sign-off: ${profile.signature}`,
  ].filter(Boolean);
  return parts.length
    ? `Freelancer profile (the only facts you may claim about them):\n${parts.join("\n")}`
    : "Freelancer profile: not provided. Do not invent one.";
}

function portfolioBlock(items: Array<Record<string, any>>) {
  if (!items.length) return "Saved portfolio: none. Do not reference any project work.";
  return `Saved portfolio (reference only these, exactly as described):\n${items
    .map(
      (p) =>
        `- id=${p.id} | ${p.name}${p.role ? ` (${p.role})` : ""}${
          p.technologies?.length ? ` | tech: ${p.technologies.join(", ")}` : ""
        }${p.results ? ` | outcome: ${p.results}` : ""}${p.description ? ` | ${String(p.description).slice(0, 300)}` : ""}`,
    )
    .join("\n")}`;
}

/* ------------------------------------------------------------------ analyze */

export const analyzeJob = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ jobDescription: z.string().trim().min(40).max(12000) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { callAI, parseJsonObject, HONESTY_RULES } = await import("./ai-core.server");
    const { profile, portfolio } = await loadContext(context.supabase, context.userId);

    const raw = await callAI(
      [
        {
          role: "system",
          content: `You analyze freelance job postings for a proposal tool. Return ONLY valid JSON, no prose.

Schema:
{"projectType":string,"summary":string,"clientNeeds":string[],"requiredSkills":string[],"technologies":string[],"deliverables":string[],"priorities":string[],"concerns":string[],"keywords":string[],"decisionFactors":string[],"skillMatch":{"strengths":string[],"gaps":string[]},"matches":[{"id":string,"reason":string}]}

Rules:
- "summary" is one sentence describing what the client actually wants.
- "concerns" are the client's likely worries, inferred from the posting only.
- "keywords" are the client's own words/phrases worth echoing in a proposal.
- "skillMatch.strengths": items copied verbatim from the freelancer's SAVED skills/services/technologies that this posting actually asks for. Never list a skill they have not saved.
- "skillMatch.gaps": things the posting asks for that appear nowhere in their saved profile or portfolio. Empty array if none.
- "matches": pick at most 3 portfolio items by their exact id, most relevant first. "reason" must cite only facts present in that item's stored description/tech/outcome and connect them to the posting. If nothing genuinely fits, return an empty array.
${HONESTY_RULES}`,
        },
        {
          role: "user",
          content: `${profileBlock(profile)}\n\n${portfolioBlock(portfolio)}\n\nJob posting:\n"""\n${data.jobDescription}\n"""\n\nReturn the JSON now.`,
        },
      ],
      { temperature: 0.2 },
    );

    const parsed = parseJsonObject<JobAnalysis & { matches?: Array<{ id: string; reason: string }> }>(raw);
    if (!parsed) throw new Error("The analysis came back unreadable. Please try again.");

    const byId = new Map(portfolio.map((p) => [String(p.id), p]));
    const matches: PortfolioMatch[] = (parsed.matches ?? [])
      .filter((m) => byId.has(m.id))
      .slice(0, 3)
      .map((m) => ({
        id: m.id,
        name: String(byId.get(m.id)?.["name"] ?? "Project"),
        reason: String(m.reason ?? "").slice(0, 400),
      }));

    const arr = (v: unknown) => (Array.isArray(v) ? v.map(String).slice(0, 10) : []);
    const analysis: JobAnalysis = {
      projectType: String(parsed.projectType ?? "Freelance project"),
      summary: String(parsed.summary ?? ""),
      clientNeeds: arr(parsed.clientNeeds),
      requiredSkills: arr(parsed.requiredSkills),
      technologies: arr(parsed.technologies),
      deliverables: arr(parsed.deliverables),
      priorities: arr(parsed.priorities),
      concerns: arr(parsed.concerns),
      keywords: arr(parsed.keywords),
      decisionFactors: arr(parsed.decisionFactors),
    };

    return { analysis, matches, hasPortfolio: portfolio.length > 0 };
  });

/* ----------------------------------------------------------------- generate */

const GenerateInput = z.object({
  jobDescription: z.string().trim().min(20).max(12000),
  platform: z.enum(PLATFORMS),
  tone: z.enum(TONES),
  length: z.enum(LENGTHS).default("Standard"),
  analysis: z.any().optional(),
  matchIds: z.array(z.string().uuid()).max(3).default([]),
});

const lengthSpec: Record<(typeof LENGTHS)[number], string> = {
  Short: "90–130 words. One tight paragraph plus a closing question.",
  Standard: "150–220 words. Two or three short paragraphs plus 3 bullet points.",
  Detailed: "260–340 words. Three paragraphs, 3–5 bullet points, and a short suggested first step.",
};

export const generateProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => GenerateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { pro } = await assertQuota(supabase, userId);
    const { callAI, HONESTY_RULES } = await import("./ai-core.server");
    const { profile, portfolio } = await loadContext(supabase, userId);
    const chosen = data.matchIds.length
      ? portfolio.filter((p) => data.matchIds.includes(String(p.id)))
      : [];

    const analysisText = data.analysis
      ? `Job analysis already produced (align the proposal with it):\n${JSON.stringify(data.analysis).slice(0, 2500)}`
      : "";

    const content = await callAI(
      [
        {
          role: "system",
          content: `You write freelance proposals that read like a competent human wrote them for this specific job.

Structure:
- Open with one specific sentence about the client's actual problem — no greetings, no "I came across your posting".
- Show relevant fit using only the supplied profile and portfolio facts.
- Close with one low-friction next step or question.
- Match the requested tone precisely. Length: ${lengthSpec[data.length]}
- Plain text only. Platform: ${data.platform}.
${HONESTY_RULES}`,
        },
        {
          role: "user",
          content: [
            profileBlock(profile),
            chosen.length ? portfolioBlock(chosen) : "Portfolio to reference: none selected.",
            analysisText,
            `Tone: ${data.tone}`,
            `Job posting:\n"""\n${data.jobDescription}\n"""`,
            "Write the proposal now.",
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      ],
      { temperature: 0.7 },
    );

    await supabase.from("generations").insert({ user_id: userId });
    const used = await countThisMonth(supabase, userId);

    return {
      content,
      usage: { used, limit: pro ? null : FREE_MONTHLY_LIMIT },
      plan: pro ? "pro" : "free",
    };
  });

/* ------------------------------------------------------------------- refine */

export const refineProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        content: z.string().trim().min(40).max(12000),
        jobDescription: z.string().trim().max(12000).default(""),
        action: z.enum(REFINE_ACTIONS),
        instruction: z.string().trim().max(400).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    await assertQuota(supabase, userId);
    const { callAI, HONESTY_RULES } = await import("./ai-core.server");
    const { profile, portfolio } = await loadContext(supabase, userId);

    const actionSpec: Record<(typeof REFINE_ACTIONS)[number], string> = {
      "Improve opening": "Rewrite only the first two sentences so they are specific to this client's problem. Keep the rest intact.",
      "More convincing": "Strengthen the argument for hiring this freelancer using existing facts only. No hype.",
      "More natural": "Make the voice sound like a real person writing quickly but carefully. Remove stiff phrasing.",
      Shorten: "Cut roughly 30% while keeping every specific detail that matters.",
      Expand: "Add depth on approach and next steps without padding or repetition.",
      Simplify: "Use plainer language and shorter sentences. Keep meaning identical.",
      "More technical": "Add concrete technical specifics grounded in the supplied skills and portfolio only.",
      "Add relevant portfolio": "Weave in the single most relevant saved portfolio project, described exactly as stored. If nothing fits, return the text unchanged.",
    };

    const content = await callAI(
      [
        {
          role: "system",
          content: `You edit an existing freelance proposal. Return ONLY the revised proposal text, plain text, no commentary.

Task: ${actionSpec[data.action]}
${HONESTY_RULES}`,
        },
        {
          role: "user",
          content: [
            profileBlock(profile),
            portfolioBlock(portfolio),
            data.jobDescription && `Job posting:\n"""\n${data.jobDescription}\n"""`,
            data.instruction && `Extra instruction from the user: ${data.instruction}`,
            `Current proposal:\n"""\n${data.content}\n"""`,
          ]
            .filter(Boolean)
            .join("\n\n"),
        },
      ],
      { temperature: 0.6 },
    );

    await supabase.from("generations").insert({ user_id: userId });
    return { content };
  });

/* -------------------------------------------------------------------- score */

export const scoreProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        content: z.string().trim().min(40).max(12000),
        jobDescription: z.string().trim().max(12000).default(""),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { callAI, parseJsonObject } = await import("./ai-core.server");
    const raw = await callAI(
      [
        {
          role: "system",
          content: `You review freelance proposals. Return ONLY valid JSON:
{"overall":number,"dimensions":[{"name":string,"score":number,"note":string}],"recommendations":string[]}

Score 0-100. Dimensions, in this exact order: Job relevance, Personalization, Clarity, Client focus, Technical fit, Portfolio relevance, Opening strength, Call to action, Readability.
Each "note" is one short, concrete observation. Each recommendation is one specific action the writer can take, e.g. "Replace the opening with a sentence about their Shopify migration deadline." No praise-only feedback, no guarantees, no invented data.`,
        },
        {
          role: "user",
          content: `${data.jobDescription ? `Job posting:\n"""\n${data.jobDescription}\n"""\n\n` : ""}Proposal:\n"""\n${data.content}\n"""\n\nReturn the JSON now.`,
        },
      ],
      { temperature: 0.2 },
    );

    const parsed = parseJsonObject<ProposalScore>(raw);
    if (!parsed) throw new Error("The review came back unreadable. Please try again.");
    const clamp = (n: unknown) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));
    return {
      overall: clamp(parsed.overall),
      dimensions: (Array.isArray(parsed.dimensions) ? parsed.dimensions : []).slice(0, 9).map((d) => ({
        name: String(d.name ?? ""),
        score: clamp(d.score),
        note: String(d.note ?? ""),
      })),
      recommendations: (Array.isArray(parsed.recommendations) ? parsed.recommendations : [])
        .slice(0, 6)
        .map(String),
    } satisfies ProposalScore;
  });

/* -------------------------------------------------------------------- usage */

export const getUsage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const pro = await isPro(supabase, userId);
    const used = await countThisMonth(supabase, userId);
    return { used, limit: pro ? null : FREE_MONTHLY_LIMIT, plan: pro ? "pro" : "free" };
  });
