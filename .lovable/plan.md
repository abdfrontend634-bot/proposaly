# Proposly AI — Premium Product Evolution (incremental)

## What already exists (verified)

- Routes: `/` landing, `/auth`, `/reset-password`, `/about`, `/_app/{dashboard,history,chat,settings,upgrade,developer}`, Lemon Squeezy webhook.
- Database: `proposals`, `generations`, `chat_messages`, `subscriptions` (RLS + service-role-only writes on subscriptions).
- Working: Supabase auth + password reset, Lemon Squeezy billing, AI proposal generation (Lovable AI Gateway), single-thread AI Assistant, server-side Founder Mode (`founder.server.ts`), Developer Mode toggle + panel, PWA update flow, pink design system.
- **Does not exist yet:** Portfolio Vault, job analysis, quality score, onboarding, user profile, proposal editor, Founder Command Center metrics. Those are new builds, not "improvements".

Nothing above gets removed or rebuilt. Everything below layers on top.

## Phase 1 — Design tokens, copy, accessibility (no logic changes)

- Extend `src/styles.css` tokens: add `--background-alt (#FFF0F5)`, `--rose-surface (#FADADD)`, warm text `#3A2630` / `#7A5A66`, `--highlight #FFB6C9`, `--gradient-rose`, focus-ring, warning, disabled tokens. Retune existing text/border tokens to the warm-dark values so contrast passes AA.
- Sweep components/routes for any remaining hardcoded colors; replace with tokens.
- Rewrite weak copy across landing, dashboard, history, settings, upgrade, empty/error/loading states. No fake stats, testimonials, or guarantees.
- Accessibility pass: visible focus rings, form labels, ARIA on icon buttons, dialog focus traps, 44px min touch targets.

## Phase 2 — Landing page storytelling

Rework `src/routes/index.tsx`: hero headline "Write proposals that fit the job.", primary + secondary CTA, soft rose atmosphere; then a 4-step visual flow (Job description → AI analysis → Portfolio match → Personalized proposal) built from real UI primitives, plus showcase sections for Dashboard / Generator / Portfolio Vault / History / Assistant. Per-route `head()` metadata kept and improved.

## Phase 3 — Portfolio Vault (new)

- Migration: `public.portfolio_items` (name, description, role, technologies[], services[], url, github_url, results, notes) with GRANTs, RLS owner-only, plus `public.profiles` for onboarding/personalization (title, bio, skills[], services[], default tone, style, signature, availability).
- New route `/_app/portfolio`: list, create, edit, delete, empty state. Nav entry added.
- Server functions in `src/lib/portfolio.functions.ts`.

## Phase 4 — Smart Proposal Engine

- `analyzeJob` server fn: returns structured JSON (project type, client needs, required skills, technologies, deliverables, priorities, concerns, keywords) — persisted on the proposal row (new `analysis jsonb` column).
- Portfolio matching: model picks relevant saved items and returns a "why this matches" reason grounded only in stored fields.
- Generator UI becomes a staged flow: paste job → Analyze (shows intelligence summary + matched projects) → Generate → Review.
- Controls: tone (Professional/Friendly/Confident/Concise/Technical), length (Short/Standard/Detailed).
- Refine actions on the result: improve opening, more convincing, more natural, shorten, expand, simplify, more technical, add portfolio, regenerate — all through one `refineProposal` server fn with a strict "never invent experience" system rule.
- Quality analyzer: `scoreProposal` returns per-dimension scores + actionable recommendations (no fake guarantees).
- Bug fix found during inspection: the free-limit count in `ai.functions.ts` doesn't filter by `user_id` (relies on RLS only) — add explicit `.eq("user_id", userId)`.

## Phase 5 — Workspace & history

`/_app/history` gains search, sort, status filter, duplicate, archive, delete, copy, export; proposal detail/editor view with save. Adds `status` + `updated_at` handling on `proposals`.

## Phase 6 — AI Assistant 2.0 + language behavior

- Assistant receives context: current route, active proposal, active job analysis, matched portfolio (server-side fetched, never client-asserted).
- Quick-action chips: improve this proposal, analyze this job, find matching portfolio, make shorter, make persuasive, explain what the client wants.
- Prompt rules: mirror the user's language (natural Urdu for Urdu, English for English, dominant language when mixed; technical terms may stay English), no repeated robotic openers ("Of course!", "Certainly!").

## Phase 7 — Onboarding & personalization

First-login onboarding (skippable, resumable) writing to `profiles`; settings page gains the same fields; generation prompts consume the profile.

## Phase 8 — Founder / Developer tools

- Founder Command Center inside `/_app/developer` (server-side founder gate, reusing `assertFounderClaims`): real counts only — users, active users, proposals generated, generations, plan distribution, chat volume, error samples, DB/auth health. No invented data, no secrets.
- Developer review modes for the assistant: architecture / code / database / security / performance / AI-cost / prompt / product / growth, with reasoning and tradeoffs.

## Phase 9 — Mobile, performance, QA

Mobile pass on every critical flow (no horizontal overflow), lazy-load heavy pieces (`jspdf`, charts, editor), query caching, skeletons everywhere, then a Playwright walkthrough of every route plus auth, billing surface, generation, portfolio, assistant, founder/developer, error/empty states.

## Technical notes

- Stays on TanStack Start + `createServerFn` + `requireSupabaseAuth`; no new backend framework.
- All new tables: explicit GRANTs, RLS owner-only policies, service_role for admin paths.
- Founder authorization stays server-side only; client never asserts founder status.
- Pricing copy stays honest: 50 free generations/month, contextual upgrade only at the real limit.
- Zod validation on every new server fn; AI JSON responses parsed defensively with fallbacks.
