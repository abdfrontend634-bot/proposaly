import "./lib/error-capture";

import { consumeLastCapturedError } from "./lib/error-capture";
import { renderErrorPage } from "./lib/error-page";

type ServerEntry = {
  fetch: (request: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
};

let serverEntryPromise: Promise<ServerEntry> | undefined;

async function getServerEntry(): Promise<ServerEntry> {
  if (!serverEntryPromise) {
    serverEntryPromise = import("@tanstack/react-start/server-entry").then(
      (m) => (m.default ?? m) as ServerEntry,
    );
  }
  return serverEntryPromise;
}

// Security headers applied to every response.
const SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
};

// Long-cache immutable static assets (hashed by the bundler).
const IMMUTABLE_ASSET_RE = /\.(?:js|css|woff2?|ttf|otf|png|jpg|jpeg|gif|webp|avif|svg|ico)$/i;

function applyResponseHardening(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  for (const [k, v] of Object.entries(SECURITY_HEADERS)) {
    if (!headers.has(k)) headers.set(k, v);
  }

  const url = new URL(request.url);
  const path = url.pathname;

  if (!headers.has("Cache-Control")) {
    if (path.startsWith("/assets/") && IMMUTABLE_ASSET_RE.test(path)) {
      headers.set("Cache-Control", "public, max-age=31536000, immutable");
    } else if (
      path === "/favicon.ico" ||
      path.startsWith("/favicon-") ||
      path === "/apple-touch-icon.png" ||
      path.startsWith("/icon-") ||
      path === "/manifest.webmanifest" ||
      path === "/robots.txt"
    ) {
      headers.set("Cache-Control", "public, max-age=86400");
    }
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

// h3 swallows in-handler throws into a normal 500 Response with body
// {"unhandled":true,"message":"HTTPError"} — try/catch alone never fires for those.
async function normalizeCatastrophicSsrResponse(response: Response): Promise<Response> {
  if (response.status < 500) return response;
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return response;

  const body = await response.clone().text();
  if (!isH3SwallowedErrorBody(body)) return response;

  console.error(consumeLastCapturedError() ?? new Error(`h3 swallowed SSR error`));
  return new Response(renderErrorPage(500), {
    status: 500,
    headers: { "content-type": "text/html; charset=utf-8" },
  });
}

function isH3SwallowedErrorBody(body: string): boolean {
  try {
    const payload = JSON.parse(body) as { unhandled?: unknown; message?: unknown };
    return payload.unhandled === true && payload.message === "HTTPError";
  } catch {
    return false;
  }
}

export default {
  async fetch(request: Request, env: unknown, ctx: unknown) {
    try {
      const handler = await getServerEntry();
      const response = await handler.fetch(request, env, ctx);
      const normalized = await normalizeCatastrophicSsrResponse(response);
      return applyResponseHardening(request, normalized);
    } catch (error) {
      console.error(error);
      return applyResponseHardening(
        request,
        new Response(renderErrorPage(500), {
          status: 500,
          headers: { "content-type": "text/html; charset=utf-8" },
        }),
      );
    }
  },
};
