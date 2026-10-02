# Proposly AI — running outside Lovable

## Requirements
- Node.js 20+ (or Bun 1.1+)
- A Supabase project (free tier works)
- An AI provider API key (OpenAI-compatible endpoint, e.g. OpenAI, OpenRouter, Google AI Studio)
- Lemon Squeezy account (only for Pro billing)

## Install & run
    npm install        # or: bun install
    cp .env.example .env   # then fill in your own values
    npm run dev        # http://localhost:8080
    npm run build && npm run preview

## Database
Run every file in `supabase/migrations/` in order (Supabase SQL editor, or `supabase db push` with the Supabase CLI). This creates all tables, RLS policies and grants.
Auth settings to configure in your Supabase dashboard: Email provider on, "Confirm email" off (current behaviour), Site URL + redirect URL for `/reset-password`.

## Environment variables
Browser (public): VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_PROJECT_ID
Server: SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, SUPABASE_SERVICE_ROLE_KEY (webhooks/admin),
LOVABLE_API_KEY (replace — see below), LEMONSQUEEZY_API_KEY, LEMONSQUEEZY_STORE_ID,
LEMONSQUEEZY_VARIANT_ID, LEMONSQUEEZY_WEBHOOK_SECRET

## Lovable-specific parts and what to change
1. AI Gateway — `src/lib/ai-core.server.ts` calls `ai.gateway.lovable.dev` with `LOVABLE_API_KEY`.
   Change GATEWAY to your provider's OpenAI-compatible URL (e.g. https://api.openai.com/v1/chat/completions),
   send `Authorization: Bearer <YOUR_KEY>`, and change the default model name (e.g. `gpt-4o-mini`).
   Check `src/lib/chat.functions.ts` for the same gateway usage.
2. Build config — `vite.config.ts` uses `@lovable.dev/vite-tanstack-config`, which bundles TanStack Start,
   React, Tailwind, tsconfig paths and Nitro (Cloudflare target). It's a public npm package and works locally.
   To drop it, use a plain Vite config with: tanstackStart(), viteReact(), tailwindcss(), tsConfigPaths(), and nitro().
3. Supabase client — `src/integrations/supabase/previewAuthStorage.ts` is a Lovable preview helper.
   Outside Lovable it falls back to normal browser storage; you can replace `storage: brokeredPreviewStorage()`
   with `storage: localStorage` in `client.ts`.
4. Error reporting — `src/lib/lovable-error-reporting.ts` reports to the Lovable editor; safe to delete/no-op.
5. URLs — canonical URLs, sitemap, robots.txt and brand links point to proposaly.lovable.app. Search/replace with your domain.
6. Webhook URL — update the Lemon Squeezy webhook to https://YOUR-DOMAIN/api/public/webhooks/lemon-squeezy.
7. Hosting — build targets Cloudflare Workers by default (Nitro). Deploy to Cloudflare, or set a Nitro preset for Vercel/Node.
8. `bunfig.toml`, `.lovable/`, `AGENTS.md` are Lovable-only and optional.
