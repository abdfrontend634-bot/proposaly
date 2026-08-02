import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { createCheckout, getSubscription } from "@/lib/billing.functions";
import { Button } from "@/components/ui/button";
import { Check, Loader2, ArrowLeft, Sparkles, Zap, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/upgrade")({
  head: () => ({ meta: [{ title: "Upgrade — Proposly AI" }] }),
  component: UpgradePage,
});

function UpgradePage() {
  const qc = useQueryClient();
  const subFn = useServerFn(getSubscription);
  const checkoutFn = useServerFn(createCheckout);

  const [redirecting, setRedirecting] = useState(false);

  const subscription = useQuery({ queryKey: ["subscription"], queryFn: () => subFn() });

  const checkout = useMutation({
    mutationFn: () => checkoutFn(),
    onSuccess: (r) => {
      setRedirecting(true);
      window.location.href = r.url;
    },
    onError: (e: Error) => {
      const msg = e.message.includes("STORE_ID") || e.message.includes("VARIANT_ID")
        ? "Billing is still being configured. Please check back later."
        : e.message;
      toast.error(msg);
    },
  });

  if (subscription.isPending) {
    return (
      <div className="grid min-h-[60vh] place-items-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (subscription.data?.isPro) {
    return (
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Pro</div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight leading-snug sm:text-3xl">
            You're on Pro
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Unlimited proposals, priority AI, and extended history are active.
          </p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-surface p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-primary/8 text-primary">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="text-sm font-medium text-foreground">Status</div>
          <div className="mt-1 text-lg font-semibold capitalize text-primary">{subscription.data.status}</div>
          {subscription.data.customerPortalUrl && (
            <Button asChild className="mt-6 w-full" size="lg">
              <a href={subscription.data.customerPortalUrl}>Manage subscription</a>
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to dashboard
        </Link>
        <div className="mt-4 text-xs font-semibold uppercase tracking-widest text-primary">Upgrade</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight leading-snug sm:text-3xl">
          Unlock unlimited proposals
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Upgrade to Pro and never worry about monthly limits again.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-border bg-surface p-7 shadow-xs">
          <h3 className="text-lg font-semibold tracking-tight">Free</h3>
          <p className="mt-1 text-sm text-muted-foreground">Generous enough to really test it.</p>
          <div className="mt-6 flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold tracking-tight">$0</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <ul className="mt-6 space-y-3 text-sm">
            <Feature text="50 proposals / month" />
            <Feature text="All platforms & tones" />
            <Feature text="Save to history" />
            <Feature text="PDF export" />
          </ul>
        </div>

        <div className="relative rounded-2xl border-2 border-primary bg-surface p-7 shadow-lg">
          <div className="absolute -top-3 left-6 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
            Pro
          </div>
          <h3 className="text-lg font-semibold tracking-tight">Pro</h3>
          <p className="mt-1 text-sm text-muted-foreground">For freelancers who bid daily.</p>
          <div className="mt-6 flex items-baseline gap-1.5">
            <span className="text-4xl font-semibold tracking-tight">$12</span>
            <span className="text-sm text-muted-foreground">/month</span>
          </div>
          <ul className="mt-6 space-y-3 text-sm">
            <Feature text="Unlimited proposal generation" />
            <Feature text="Access to all 40+ proposal styles" />
            <Feature text="AI Proposal Rewrite" />
            <Feature text="AI Proposal Optimizer" />
            <Feature text="Proposal Score" />
            <Feature text="AI Suggestions" />
            <Feature text="Cover Letter Generator" />
            <Feature text="Client Questions Auto Answer" />
            <Feature text="English ↔ Urdu translator & more languages" />
            <Feature text="English Simplifier" />
            <Feature text="AI Freelancer Coach" />
            <Feature text="Chat history" />
            <Feature text="Priority AI responses" />
            <Feature text="Faster generation speed" />
            <Feature text="Unlimited PDF exports" />
            <Feature text="Unlimited saved proposal history" />
            <Feature text="Future premium AI features included" />
          </ul>

          <Button
            className="mt-8 w-full"
            size="lg"
            disabled={checkout.isPending || redirecting}
            onClick={() => checkout.mutate()}
          >
            {checkout.isPending || redirecting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            {redirecting ? "Redirecting…" : "Upgrade to Pro"}
          </Button>
          <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" /> Secure checkout via Lemon Squeezy
          </div>
        </div>
      </div>
    </div>
  );
}

function Feature({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-2.5">
      <div className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary/10">
        <Check className="h-3 w-3 text-primary" strokeWidth={3} />
      </div>
      <span className="text-foreground">{text}</span>
    </li>
  );
}
