import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getSubscription, getCustomerPortalUrl } from "@/lib/billing.functions";
import { getProfile, saveProfile, TONES, LENGTHS } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  LogOut,
  Mail,
  KeyRound,
  Shield,
  Crown,
  ExternalLink,
  Terminal,
  UserRound,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "@/lib/brand";
import { useDeveloperMode } from "@/lib/use-developer-mode";
import { useFounder } from "@/lib/use-founder";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Proposly AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { enabled: devMode, set: setDevMode } = useDeveloperMode();
  const { isFounder } = useFounder();
  const [taps, setTaps] = useState(0);

  const subFn = useServerFn(getSubscription);
  const portalFn = useServerFn(getCustomerPortalUrl);

  const subscription = useQuery({ queryKey: ["subscription"], queryFn: () => subFn() });
  const portal = useMutation({
    mutationFn: () => portalFn(),
    onSuccess: (r) => {
      window.location.href = r.url;
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be at least 6 characters.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPw("");
    toast.success("Password updated");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Account</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight leading-snug sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Manage your Proposly AI account.
        </p>
      </div>

      <Section icon={Mail} title="Account" description="Your account details.">
        <div className="rounded-lg border border-border bg-surface-soft px-4 py-3 text-sm font-medium text-foreground">
          {user?.email}
        </div>
      </Section>

      <Section
        icon={Crown}
        title="Subscription"
        description="Your plan and billing details."
      >
        <div className="rounded-lg border border-border bg-surface-soft px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">
                {subscription.data?.isPro ? "Pro" : "Free"}
              </div>
              <div className="text-xs text-muted-foreground">
                {subscription.data?.isPro
                  ? "Unlimited proposals, priority AI, and extended history."
                  : "50 proposals per month."}
              </div>
            </div>
            {subscription.data?.isPro ? (
              <Button
                variant="outline"
                size="sm"
                disabled={portal.isPending}
                onClick={() => portal.mutate()}
              >
                {portal.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Manage
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/upgrade">Upgrade</Link>
              </Button>
            )}
          </div>
        </div>
      </Section>

      <Section
        icon={KeyRound}
        title="Change password"
        description="Update the password used to sign in."
      >
        <form onSubmit={changePassword} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="pw" className="text-sm font-medium">
              New password
            </Label>
            <Input
              id="pw"
              type="password"
              minLength={6}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <Button type="submit" disabled={busy || !pw}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </Section>

      <Section icon={Shield} title="Session" description="Sign out on this device.">
        <Button variant="outline" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </Section>

      {devMode && isFounder && (
        <Section
          icon={Terminal}
          title="Developer mode"
          description="Local diagnostics for this browser only."
        >
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/developer">Open developer panel</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setDevMode(false);
                toast.success("Developer mode disabled");
              }}
            >
              Turn off
            </Button>
          </div>
        </Section>
      )}

      <div className="pb-2 text-center">
        <button
          type="button"
          onClick={() => {
            if (!isFounder) return;
            const next = taps + 1;
            setTaps(next);
            if (next >= 5 && !devMode) {
              setDevMode(true);
              toast.success("Developer mode enabled");
            }
          }}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`${BRAND.name} version ${BRAND.version}`}
        >
          {BRAND.name} v{BRAND.version}
        </button>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-7 shadow-xs">
      <div className="mb-6 flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
