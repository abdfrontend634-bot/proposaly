# Deployment

Proposly AI is built with TanStack Start (Vite 7) and deploys as an edge server bundle. In Lovable, click **Publish** — the app builds and deploys automatically to the Lovable hosting edge.

## Build

```bash
bun install
bun run build   # production build (SSR + client)
bun run preview # local preview of the production build
```

Output is emitted to `.output/` (server) and `.output/public/` (static assets, long-cached and content-hashed).

## Environment variables

All required env vars are provisioned automatically by Lovable Cloud. Nothing needs to be pasted by hand.

### Server-only (never exposed to the browser)

| Name | Purpose |
| --- | --- |
| `SUPABASE_URL` | Supabase project URL used by server functions. |
| `SUPABASE_PUBLISHABLE_KEY` | Supabase publishable API key (RLS-enforced). |
| `LOVABLE_API_KEY` | Lovable AI Gateway key used by proposal generation. |

These are read only inside server-function handlers (`process.env.*`) and never bundled into client code.

### Client-safe (public, injected at build time)

| Name | Purpose |
| --- | --- |
| `VITE_SUPABASE_URL` | Same URL, exposed to the browser Supabase client. |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable API key, safe to ship to the client. |
| `VITE_SUPABASE_PROJECT_ID` | Project identifier used by the generated Supabase client. |

Only variables prefixed with `VITE_` are inlined into client bundles. Any other `process.env.*` reference is server-only.

## Production hardening

Applied globally by `src/server.ts`:

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `Cache-Control: public, max-age=31536000, immutable` for hashed `/assets/*`
- `Cache-Control: public, max-age=86400` for favicons, icons, manifest, robots.txt

## Error pages

- **404** — TanStack Router `notFoundComponent` in `src/routes/__root.tsx`.
- **500** — Server-rendered fallback in `src/lib/error-page.ts`, served by `src/server.ts` when SSR throws.

Both pages are branded, `noindex`, and reuse the app's palette.

## Notes on other hosts

The template targets an edge server runtime (Cloudflare Workers-compatible). Vercel Edge Functions run the same standard `fetch` handler exported from `src/server.ts`, so no code changes are required to deploy there — configure Vercel to use the Node/Edge output from `.output/`. For app-internal logic, keep using TanStack server functions rather than adding a parallel API layer.
