import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const list = z.array(z.string().trim().min(1).max(60)).max(40).default([]);

export const TONES = ["Professional", "Friendly", "Confident", "Concise", "Technical"] as const;
export const LENGTHS = ["Short", "Standard", "Detailed"] as const;

const ProfileInput = z.object({
  display_name: z.string().trim().max(80).default(""),
  professional_title: z.string().trim().max(120).default(""),
  bio: z.string().trim().max(1200).default(""),
  skills: list,
  services: list,
  technologies: list,
  experience: z.string().trim().max(400).default(""),
  preferred_tone: z.enum(TONES).default("Professional"),
  preferred_length: z.enum(LENGTHS).default("Standard"),
  signature: z.string().trim().max(300).default(""),
  availability: z.string().trim().max(200).default(""),
  onboarded: z.boolean().optional(),
});

export type ProfileInput = z.infer<typeof ProfileInput>;

export const getProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error("Couldn't load your profile. Please refresh and try again.");
    return data ?? null;
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ProfileInput.parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("profiles")
      .upsert({ user_id: context.userId, ...data }, { onConflict: "user_id" });
    if (error) throw new Error("Couldn't save your profile. Please try again.");
    return { ok: true };
  });
