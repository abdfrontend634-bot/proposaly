import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const list = z.array(z.string().trim().min(1).max(60)).max(30).default([]);

const ItemInput = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(2000).default(""),
  role: z.string().trim().max(120).default(""),
  technologies: list,
  services: list,
  url: z.string().trim().url().max(500).nullish(),
  github_url: z.string().trim().url().max(500).nullish(),
  results: z.string().trim().max(1000).default(""),
  notes: z.string().trim().max(1000).default(""),
});

export type PortfolioItemInput = z.infer<typeof ItemInput>;

export const listPortfolio = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("portfolio_items")
      .select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error("Couldn't load your portfolio. Please refresh and try again.");
    return data ?? [];
  });

export const savePortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ItemInput.parse(d))
  .handler(async ({ data, context }) => {
    const row = {
      user_id: context.userId,
      name: data.name,
      description: data.description,
      role: data.role,
      technologies: data.technologies,
      services: data.services,
      url: data.url || null,
      github_url: data.github_url || null,
      results: data.results,
      notes: data.notes,
    };

    if (data.id) {
      const { error } = await context.supabase
        .from("portfolio_items")
        .update(row)
        .eq("id", data.id)
        .eq("user_id", context.userId);
      if (error) throw new Error("Couldn't save your changes. Please try again.");
      return { id: data.id };
    }

    const { data: inserted, error } = await context.supabase
      .from("portfolio_items")
      .insert(row)
      .select("id")
      .single();
    if (error) throw new Error("Couldn't add that project. Please try again.");
    return { id: inserted.id };
  });

export const deletePortfolioItem = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("portfolio_items")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error("Couldn't delete that project. Please try again.");
    return { ok: true };
  });
