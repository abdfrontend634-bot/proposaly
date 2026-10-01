import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Sparkles,
  Target,
  ShieldCheck,
  ClipboardList,
  FolderOpen,
  PenLine,
  Gauge,
  MessageSquare,
  History as HistoryIcon,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand";
import { BRAND } from "@/lib/brand";

const TITLE = "Proposly AI — AI Proposal Generator for Freelancers";
const DESCRIPTION =
  "Proposly AI is an AI proposal generator for freelancers on Upwork, Fiverr and Freelancer. Paste a job posting, get a client-focused proposal written from your real skills and portfolio — free to start.";
const SITE_URL = "https://proposaly.lovable.app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { property: "og:url", content: `${SITE_URL}/` },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: `${SITE_URL}/` }],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Flow />
        <Capabilities />
        <Pricing />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-surface/90 backdrop-blur-md shadow-xs">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <LogoMark />
          <span className="text-[17px] font-semibold tracking-tight">{BRAND.name}</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
          </a>
          <a href="#features" className="transition-colors hover:text-foreground">
            Features
          </a>
          <a href="#pricing" className="transition-colors hover:text-foreground">
            Pricing
          </a>
          <a href="#faq" className="transition-colors hover:text-foreground">
            FAQ
          </a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/auth"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:block"
          >
            Sign in
          </Link>
          <Button asChild size="sm" className="h-9 px-4">
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
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-[-14rem] h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,77,136,0.26),rgba(255,77,136,0)_70%)] blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-[38rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.75),rgba(255,255,255,0))]"
      />
      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-20 text-center sm:pt-28">
        <div className="animate-fade-up mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
          Job analysis · portfolio matching · quality score
        </div>
        <h1 className="animate-fade-up mt-7 text-4xl font-semibold leading-[1.06] tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Write proposals that
          <br />
          <span className="bg-gradient-rose bg-clip-text text-transparent">fit the job.</span>
        </h1>
        <p className="animate-fade-up mx-auto mt-7 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Paste the posting. Proposly AI reads what the client is actually asking for, pulls the
          projects from your vault that genuinely match, and writes a proposal in your voice — no
          invented experience.
        </p>
        <div className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="group rose-glow">
            <Link to="/auth">
              Start free
              <ArrowRight className="ml-0.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <a href="#how">See how it works</a>
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" /> No credit card
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" /> 50 free proposals /
            month
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-success" aria-hidden="true" /> Cancel anytime
          </span>
        </div>

        <div className="animate-fade-up mx-auto mt-16 max-w-3xl text-left">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
            <div className="flex items-center gap-2 border-b border-border bg-surface-soft px-4 py-3">
              <ClipboardList className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
              <div className="text-[11px] font-medium text-muted-foreground">
                What Proposly AI extracts from a posting
              </div>
            </div>
            <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
              <MiniPanel
                label="Client needs"
                items={["Fix a slow checkout", "Reduce cart abandonment", "Handoff documentation"]}
              />
              <MiniPanel
                label="Required skills"
                items={["Performance profiling", "Frontend optimisation", "Analytics review"]}
              />
              <MiniPanel
                label="Likely concerns"
                items={["Past devs missed deadlines", "Wants weekly updates"]}
              />
              <MiniPanel
                label="Matched from your vault"
                items={["Only projects you saved yourself"]}
                accent
              />
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Illustration of the analysis structure — your results come from your own posting and
            saved projects.
          </p>
        </div>
      </div>
    </section>
  );
}

function MiniPanel({
  label,
  items,
  accent,
}: {
  label: string;
  items: string[];
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-4 ${
        accent ? "border-primary/25 bg-primary/5" : "border-border bg-surface-soft"
      }`}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">{label}</div>
      <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
        {items.map((i) => (
          <li key={i} className="flex items-start gap-2">
            <span
              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary/50"
              aria-hidden="true"
            />
            {i}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Flow() {
  const steps = [
    {
      icon: ClipboardList,
      title: "Job description",
      body: "Paste the full posting — Upwork, Fiverr, Freelancer, LinkedIn, or a direct client brief.",
    },
    {
      icon: Target,
      title: "AI analysis",
      body: "Proposly extracts the deliverables, required skills, priorities, and the client's likely concerns.",
    },
    {
      icon: FolderOpen,
      title: "Portfolio match",
      body: "It picks the saved projects that genuinely fit, and tells you why each one matches.",
    },
    {
      icon: PenLine,
      title: "Personalized proposal",
      body: "You get a proposal grounded in your real profile and projects — then refine it in one click.",
    },
  ];
  return (
    <section id="how" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            How it works
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Four steps, one continuous flow.
          </h2>
          <p className="mt-5 text-base text-muted-foreground sm:text-lg">
            Nothing is invented along the way. Every claim traces back to something you wrote or
            saved.
          </p>
        </div>
        <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li
              key={s.title}
              className="rounded-2xl border border-border bg-surface p-7 shadow-xs transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-5 grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
                <s.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="text-xs font-semibold text-muted-foreground">Step {i + 1}</div>
              <h3 className="mt-1.5 text-base font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Capabilities() {
  const items = [
    {
      icon: Sparkles,
      title: "Staged generator",
      body: "Analyse, review the matches, choose tone and length, then generate — instead of one blind prompt.",
    },
    {
      icon: FolderOpen,
      title: "Portfolio Vault",
      body: "Store your projects once: role, technologies, outcomes, links. The AI may only reference these.",
    },
    {
      icon: Gauge,
      title: "Quality score",
      body: "Score any proposal across nine dimensions and get concrete edits, not compliments.",
    },
    {
      icon: PenLine,
      title: "One-click refinements",
      body: "Improve the opening, make it more convincing, shorten, expand, simplify, or add a project.",
    },
    {
      icon: HistoryIcon,
      title: "Workspace history",
      body: "Search, filter, reopen, edit, duplicate, copy, or export anything you've saved.",
    },
    {
      icon: MessageSquare,
      title: "AI assistant",
      body: "Ask follow-ups in your own language, English or Urdu, with your current work as context.",
    },
  ];
  return (
    <section id="features" className="border-t border-border/70 bg-surface/40 py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            Inside Proposly AI
          </div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Built for people who bid every day.
          </h2>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f) => (
            <div key={f.title} className="rounded-2xl border border-border bg-surface p-7 shadow-xs">
              <div className="mb-5 grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary">
                <f.icon className="h-4.5 w-4.5" aria-hidden="true" />
              </div>
              <h3 className="text-base font-semibold tracking-tight">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">Pricing</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Start free. Upgrade when it pays for itself.
          </h2>
        </div>
        <div className="mx-auto mt-14 grid max-w-3xl gap-6 md:grid-cols-2">
          <PriceCard
            name="Free"
            price="$0"
            blurb="Enough to run it on real jobs."
            features={[
              "50 proposals per month",
              "Job analysis and portfolio matching",
              "All platforms, tones, and lengths",
              "Portfolio Vault and saved history",
              "PDF export",
            ]}
            cta="Start free"
          />
          <PriceCard
            name="Pro"
            price="$12"
            blurb="For freelancers bidding daily."
            features={[
              "Unlimited proposal generation",
              "Unlimited refinements and quality scoring",
              "Priority AI processing",
              "Extended proposal history",
              "New premium features as they ship",
            ]}
            highlighted
            cta="Get Pro"
          />
        </div>
      </div>
    </section>
  );
}

function PriceCard({
  name,
  price,
  blurb,
  features,
  cta,
  highlighted,
}: {
  name: string;
  price: string;
  blurb: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
}) {
  return (
    <div
      className={`relative rounded-2xl p-8 transition-all ${
        highlighted
          ? "border-2 border-primary bg-surface shadow-lg"
          : "border border-border bg-surface shadow-xs hover:shadow-md"
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-8 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary-foreground">
          Most complete
        </div>
      )}
      <h3 className="text-lg font-semibold tracking-tight">{name}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground">{blurb}</p>
      <div className="mt-8 flex items-baseline gap-1.5">
        <span className="text-5xl font-semibold tracking-tight">{price}</span>
        <span className="text-sm text-muted-foreground">/month</span>
      </div>
      <ul className="mt-8 space-y-3.5 text-sm">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <div className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full bg-primary/10">
              <Check className="h-3 w-3 text-primary" strokeWidth={3} aria-hidden="true" />
            </div>
            <span className="text-foreground">{f}</span>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-10 w-full" variant={highlighted ? "default" : "outline"} size="lg">
        <Link to="/auth">{cta}</Link>
      </Button>
    </div>
  );
}

function FAQ() {
  const items = [
    {
      q: "How does the free plan work?",
      a: "You get 50 AI generations every calendar month — that covers proposals and refinements. No credit card required.",
    },
    {
      q: "Can the AI invent experience I don't have?",
      a: "No. It may only reference the profile and projects you save yourself. If nothing in your vault fits a job, it says so instead of making something up.",
    },
    {
      q: "Which platforms are supported?",
      a: "Upwork, Fiverr, Freelancer, LinkedIn, and direct client briefs. The output is plain text, so it works anywhere.",
    },
    {
      q: "Can I edit what it writes?",
      a: "Yes. Every proposal is editable inline, and one-click refinements handle the common rewrites before you copy, save, or export.",
    },
    {
      q: "Is my data private?",
      a: "Your profile, portfolio, job descriptions, and proposals are visible only to your account.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-border/70 bg-surface/40 py-24">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">FAQ</div>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
            Questions, answered.
          </h2>
        </div>
        <div className="mt-12 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-surface">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={it.q}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-${i}`}
                  className="flex min-h-11 w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-surface-soft"
                >
                  <span className="text-[15px] font-medium text-foreground">{it.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                    aria-hidden="true"
                  />
                </button>
                {isOpen && (
                  <div id={`faq-${i}`} className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
                    {it.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-3xl border border-border bg-surface px-8 py-14 text-center shadow-sm sm:px-16">
          <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Stop writing from scratch.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-base text-muted-foreground sm:text-lg">
            Set up your profile and portfolio once, then let every proposal start from the job in
            front of you.
          </p>
          <Button asChild size="lg" className="mt-8 rose-glow">
            <Link to="/auth">
              Get started free
              <ArrowRight className="ml-0.5 h-4 w-4" aria-hidden="true" />
            </Link>
          </Button>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" /> Private to your account
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Check className="h-3.5 w-3.5" aria-hidden="true" /> No invented experience
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border/70 py-12">
      <div className="mx-auto max-w-6xl px-6">
        <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-2.5">
            <LogoMark />
            <span className="text-sm font-semibold tracking-tight">{BRAND.name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground">
              How it works
            </a>
            <a href="#features" className="hover:text-foreground">
              Features
            </a>
            <a href="#pricing" className="hover:text-foreground">
              Pricing
            </a>
            <a href="#faq" className="hover:text-foreground">
              FAQ
            </a>
            <Link to="/about" className="hover:text-foreground">
              About
            </Link>
            <Link to="/auth" className="hover:text-foreground">
              Sign in
            </Link>
          </div>
        </div>
        <div className="mt-8 flex flex-col-reverse items-start justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center">
          <div>
            © {new Date().getFullYear()} {BRAND.legalName}. All rights reserved. v{BRAND.version}
          </div>
          <div>AI-powered proposals for freelancers.</div>
        </div>
      </div>
    </footer>
  );
}
