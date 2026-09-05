import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { PLATFORMS, TONES, LENGTHS } from "./ai.functions";
import type { JobAnalysis, PortfolioMatch, ProposalScore } from "./ai.functions";

export const STATUSES = ["draft", "sent", "won", "lost"] as const;
export type ProposalStatus = (typeof STATUSES)[number];

const SELECT =
  "id,title,platform,tone,length,status,content,job_description,analysis,matched_portfolio,score,created_at,updated_at";

export type ProposalRow = {
  id: string;
  title: string;
  platform: string;
  tone: string;
  length: string;
  status: string;
  content: string;
  job_description: string;
  analysis: unknown;
  matched_portfolio: unknown;
  score: unknown;
  created_at: string;
  updated_at: string;
};

export const listProposals = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("proposals")
      .select(SELECT)
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Couldn't load your proposals. Please refresh and try again.");
    return (data ?? []) as unknown as ProposalRow[];
  });

export const getProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("proposals")
      .select(SELECT)
      .eq("id", data.id)
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error("Couldn't load that proposal. Please try again.");
    if (!row) throw new Error("That proposal no longer exists.");
    return row as unknown as ProposalRow;
  });

const UpdateInput = z.object({
  id: z.string().uuid(),
  title: z.string().trim().min(1).max(160).optional(),
  content: z.string().trim().min(1).max(20000).optional(),
  status: z.enum(STATUSES).optional(),
  platform: z.enum(PLATFORMS).optional(),
  tone: z.enum(TONES).optional(),
  length: z.enum(LENGTHS).optional(),
});

export const updateProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateInput.parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    if (Object.keys(patch).length === 0) return { ok: true };
    const { error } = await context.supabase
      .from("proposals")
      .update(patch)
      .eq("id", id)
      .eq("user_id", context.userId);
    if (error) throw new Error("Couldn't save your changes. Please try again.");
    return { ok: true };
  });

export const duplicateProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: row, error } = await supabase
      .from("proposals")
      .select(SELECT)
      .eq("id", data.id)
      .eq("user_id", userId)
      .maybeSingle();
    if (error || !row) throw new Error("Couldn't duplicate that proposal. Please try again.");

    const source = row as unknown as ProposalRow;
    const { data: inserted, error: insErr } = await supabase
      .from("proposals")
      .insert({
        user_id: userId,
        title: `${source.title} (copy)`.slice(0, 160),
        platform: source.platform,
        tone: source.tone,
        length: source.length,
        status: "draft",
        content: source.content,
        job_description: source.job_description,
        analysis: source.analysis as never,
        matched_portfolio: source.matched_portfolio as never,
        score: source.score as never,
      })
      .select("id")
      .single();
    if (insErr) throw new Error("Couldn't duplicate that proposal. Please try again.");
    return { id: inserted.id as string };
  });

export const deleteProposal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("proposals")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error("Couldn't delete that proposal. Please try again.");
    return { ok: true };
  });
