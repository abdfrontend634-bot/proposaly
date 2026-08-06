import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useAuth } from "@/lib/auth-context";
import { getUsage } from "@/lib/ai.functions";
import { getSubscription } from "@/lib/billing.functions";
import { useDeveloperMode } from "@/lib/use-developer-mode";
import { useFounder } from "@/lib/use-founder";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/lib/brand";
import { Terminal, CheckCircle2, XCircle, RefreshCw, Copy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/developer")({
  head: () => ({ meta: [{ title: `Developer mode — ${BRAND.name}` }] }),
  component: DeveloperPage,
});

function DeveloperPage() {
  const { enabled, set } = useDeveloperMode();
  const { isFounder, loading: founderLoading } = useFounder();
  const navigate = useNavigate();
  const { user, session } = useAuth();

  useEffect(() => {
    if (!founderLoading && !isFounder) navigate({ to: "/dashboard", replace: true });
  }, [founderLoading, isFounder, navigate]);
  const usageFn = useServerFn(getUsage);
  const subFn = useServerFn(getSubscription);

  const usage = useQuery({ queryKey: ["usage"], queryFn: () => usageFn() });
  const subscription = useQuery({ queryKey: ["subscription"], queryFn: () => subFn() });

  const [env, setEnv] = useState<{ viewport: string; ua: string; lang: string } | null>(null);
  useEffect(() => {
    setEnv({
      viewport: `${window.innerWidth}×${window.innerHeight}`,
      ua: navigator.userAgent,
      lang: navigator.language,
    });
  }, []);

  const diagnostics = {
    app: BRAND.name,
    version: BRAND.version,
    mode: import.meta.env.MODE,
    userId: user?.id ?? null,
    email: user?.email ?? null,
    sessionExpiresAt: session?.expires_at ?? null,
    plan: subscription.data?.isPro ? "pro" : "free",
    usage: usage.data ?? null,
    viewport: env?.viewport ?? null,
    language: env?.lang ?? null,
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Internal</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight leading-snug sm:text-3xl">
          Developer mode
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Local diagnostics for this browser only. Nothing here is shared with other users and no
          secrets are exposed.
        </p>
      </div>

      <section className="rounded-2xl border border-border bg-surface p-7 shadow-xs">
        <div className="mb-6 flex items-start gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
            <Terminal className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Runtime</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Current build, session and quota state.
            </p>
          </div>
        </div>

        <dl className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          <Row label="App" value={`${BRAND.name} v${BRAND.version}`} />
          <Row label="Build mode" value={import.meta.env.MODE} />
          <Row label="Plan" value={subscription.isLoading ? "…" : diagnostics.plan} />
          <Row
            label="Usage this month"
            value={
              usage.isLoading
                ? "…"
                : `${usage.data?.used ?? 0} / ${usage.data?.limit ?? "unlimited"}`
            }
          />
          <Row label="User ID" value={user?.id ?? "—"} mono />
          <Row label="Email" value={user?.email ?? "—"} />
          <Row label="Viewport" value={env?.viewport ?? "—"} />
          <Row label="Language" value={env?.lang ?? "—"} />
        </dl>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              usage.refetch();
              subscription.refetch();
              toast.success("Diagnostics refreshed");
            }}
          >
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              navigator.clipboard.writeText(JSON.stringify(diagnostics, null, 2));
              toast.success("Diagnostics copied");
            }}
          >
            <Copy className="mr-1.5 h-3.5 w-3.5" /> Copy JSON
          </Button>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-7 shadow-xs">
        <h2 className="text-lg font-semibold tracking-tight">Health checks</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Quick verification that the core services respond.
        </p>
        <ul className="mt-5 space-y-2.5 text-sm">
          <Health label="Auth session" ok={!!session} />
          <Health label="Usage endpoint" ok={!usage.isError && !usage.isLoading} />
          <Health label="Billing endpoint" ok={!subscription.isError && !subscription.isLoading} />
        </ul>
      </section>

      <section className="rounded-2xl border border-border bg-surface p-7 shadow-xs">
        <h2 className="text-lg font-semibold tracking-tight">Session</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Turn developer mode off to hide this page again.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => {
              set(false);
              toast.success("Developer mode disabled");
            }}
            disabled={!enabled}
          >
            Disable developer mode
          </Button>
          <Button asChild variant="ghost">
            <Link to="/settings">Back to settings</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-background px-4 py-2.5">
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd
        className={`min-w-0 max-w-full truncate text-sm text-foreground ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

function Health({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-2.5 rounded-lg border border-border bg-background px-3.5 py-2.5">
      {ok ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
      ) : (
        <XCircle className="h-4 w-4 shrink-0 text-destructive" />
      )}
      <span className="text-foreground">{label}</span>
      <span className="ml-auto text-xs text-muted-foreground">{ok ? "OK" : "Unavailable"}</span>
    </li>
  );
}
