import { createFileRoute, Link } from "@tanstack/react-router";
import { Sparkles, Zap, Target, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <HowItWorks />
      <Pricing />
      <CTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-inset ring-brand/30">
            <Sparkles className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">Gigify</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground sm:flex">
          <a href="#how" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link to="/auth" className="hidden text-sm text-muted-foreground hover:text-foreground sm:block">
            Sign in
          </Link>
          <Button asChild size="sm">
            <Link to="/auth">Get started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]" />
      <div className="absolute inset-0 bg-radial-brand" />
      <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-20 text-center sm:pt-28">
        <div className="animate-fade-up mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface/50 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          AI-powered proposals for freelancers
        </div>
        <h1 className="animate-fade-up mt-6 text-4xl font-extrabold tracking-tight text-gradient-brand sm:text-6xl">
          Win more gigs.<br />Write fewer proposals.
        </h1>
        <p className="animate-fade-up mx-auto mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
          Paste the job post. Pick your platform and tone. Ship a tailored proposal in under 10 seconds.
        </p>
        <div className="animate-fade-up mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="group">
            <Link to="/auth">
              Start writing free
              <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <a href="#how" className="text-sm text-muted-foreground hover:text-foreground">
            See how it works →
          </a>
        </div>

        <div className="animate-fade-up mx-auto mt-14 max-w-3xl rounded-2xl border border-border bg-surface/60 p-2 shadow-card backdrop-blur">
          <div className="rounded-xl border border-border/60 bg-background p-6 text-left">
            <div className="mb-3 flex items-center gap-1.5">
              <div className="h-2.5 w-2.5 rounded-full bg-muted" />
              <div className="h-2.5 w-2.5 rounded-full bg-muted" />
              <div className="h-2.5 w-2.5 rounded-full bg-muted" />
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              <span className="text-foreground">Hi Alex,</span> I noticed you're rebuilding checkout on Shopify and losing customers at PayPal — I've cut that exact drop-off by 30% for two DTC brands last quarter…
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    { icon: Target, title: "Paste the job", body: "Drop the Upwork, Fiverr or Freelancer posting into Gigify." },
    { icon: Sparkles, title: "Pick tone & platform", body: "Professional, Friendly, or Confident — we adapt to each marketplace." },
    { icon: Zap, title: "Generate & send", body: "A tailored proposal in seconds. Edit inline, copy, or export as PDF." },
  ];
  return (
    <section id="how" className="border-t border-border/60 py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Three steps. Zero busywork.</h2>
          <p className="mt-4 text-muted-foreground">Built for freelancers who bid all day.</p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="rounded-2xl border border-border bg-surface/40 p-6 transition-colors hover:bg-surface">
              <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-inset ring-brand/30">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-xs font-mono text-muted-foreground">0{i + 1}</div>
              <h3 className="mt-1 text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="border-t border-border/60 py-24">
      <div className="mx-auto max-w-5xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Simple pricing</h2>
          <p className="mt-4 text-muted-foreground">Start free. Upgrade when you're winning.</p>
        </div>
        <div className="mx-auto mt-14 grid max-w-3xl gap-6 sm:grid-cols-2">
          <PriceCard
            name="Free"
            price="$0"
            blurb="Perfect for trying it out."
            features={["5 proposals / month", "All platforms & tones", "Save to history", "PDF export"]}
            cta="Start free"
          />
          <PriceCard
            name="Pro"
            price="$12"
            blurb="For freelancers bidding daily."
            features={["Unlimited proposals", "Priority AI model", "Longer history", "Coming soon"]}
            highlighted
            cta="Coming soon"
            disabled
          />
        </div>
      </div>
    </section>
  );
}

function PriceCard({
  name, price, blurb, features, cta, highlighted, disabled,
}: {
  name: string; price: string; blurb: string; features: string[];
  cta: string; highlighted?: boolean; disabled?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl border p-6 ${
        highlighted
          ? "border-brand/40 bg-brand/[0.04] shadow-glow"
          : "border-border bg-surface/40"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 right-6 rounded-full border border-brand/40 bg-background px-2 py-0.5 text-xs text-brand">
          Popular
        </div>
      )}
      <h3 className="text-lg font-semibold">{name}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{blurb}</p>
      <div className="mt-6 flex items-baseline gap-1">
        <span className="text-4xl font-bold tracking-tight">{price}</span>
        <span className="text-sm text-muted-foreground">/mo</span>
      </div>
      <ul className="mt-6 space-y-3 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2">
            <Check className="mt-0.5 h-4 w-4 text-brand" />
            <span className="text-muted-foreground">{f}</span>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-8 w-full" variant={highlighted ? "default" : "secondary"} disabled={disabled}>
        {disabled ? <span>{cta}</span> : <Link to="/auth">{cta}</Link>}
      </Button>
    </div>
  );
}

function CTA() {
  return (
    <section className="border-t border-border/60 py-24">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Stop writing from scratch.</h2>
        <p className="mt-4 text-muted-foreground">Join freelancers shipping better proposals with Gigify.</p>
        <Button asChild size="lg" className="mt-8">
          <Link to="/auth">Get started free</Link>
        </Button>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/60 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-muted-foreground sm:flex-row">
        <div>© {new Date().getFullYear()} Gigify</div>
        <div>AI-powered proposals for freelancers</div>
      </div>
    </footer>
  );
}
