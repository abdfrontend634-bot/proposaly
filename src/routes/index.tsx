import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Check,
  Sparkles,
  Zap,
  Target,
  ShieldCheck,
  Clock,
  FileText,
  ChevronDown,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <Hero />
      <LogoBar />
      <HowItWorks />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTA />
      <Footer />
    </div>
  );
}

function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo />
          <span className="text-[17px] font-semibold tracking-tight">{BRAND.name}</span>
        </Link>
        <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
          <a href="#how" className="transition-colors hover:text-foreground">
            How it works
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

function Logo() {
  return <LogoMark />;
}

function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="relative mx-auto max-w-5xl px-6 pb-24 pt-24 text-center sm:pt-32">
        <div className="animate-fade-up mx-auto inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground shadow-xs">
          <span className="h-1.5 w-1.5 rounded-full bg-[#16A34A]" />
          New — Claude-powered proposal engine
        </div>
        <h1 className="animate-fade-up mt-7 text-5xl font-semibold leading-[1.05] tracking-tight text-foreground sm:text-6xl md:text-7xl">
          Win more gigs.
          <br />
          <span className="text-muted-foreground">Write fewer proposals.</span>
        </h1>
        <p className="animate-fade-up mx-auto mt-7 max-w-xl text-lg leading-relaxed text-muted-foreground">
          Paste the job post, pick your platform and tone, and ship a tailored proposal in under 10
          seconds.
        </p>
        <div className="animate-fade-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg" className="group">
            <Link to="/auth">
              Start free
              <ArrowRight className="ml-0.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </Button>
          <a
            href="#how"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            See how it works →
          </a>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-success" /> No credit card
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-success" /> 50 free proposals / month
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="h-3.5 w-3.5 text-success" /> Cancel anytime
          </span>
        </div>

        <div className="animate-fade-up mx-auto mt-20 max-w-3xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-lg">
            <div className="flex items-center gap-1.5 border-b border-border bg-[#FAFAF7] px-4 py-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[#E5E7EB]" />
              <div className="ml-3 text-[11px] font-medium text-muted-foreground">
                Proposly AI — Upwork proposal
              </div>
            </div>
            <div className="p-8 text-left">
              <p className="text-[15px] leading-[1.7] text-foreground">
                Hi there — I saw your project and it aligns perfectly with what I do best. I
                specialize in delivering high-quality work with clear communication, fast
                turnaround, and a{" "}
                <span className="font-medium text-primary">results-driven approach</span> that helps
                clients move forward with confidence.
              </p>
              <div className="mt-6 flex items-center gap-2 border-t border-border pt-5">
                <div className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                  Upwork
                </div>
                <div className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  Professional
                </div>
                <div className="ml-auto text-[11px] text-muted-foreground">Generated in 8.2s</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoBar() {
  const items = ["Upwork", "Fiverr", "Freelancer", "Contra", "Toptal"];
  return (
    <section className="border-y border-border/70 bg-surface/40 py-10">
      <div className="mx-auto max-w-5xl px-6">
        <p className="text-center text-xs font-medium uppercase tracking-widest text-muted-foreground">
          Trusted by freelancers on
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
          {items.map((n) => (
            <div key={n} className="text-lg font-semibold tracking-tight text-muted-foreground/70">
              {n}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      icon: Target,
      title: "Paste the job",
      body: "Drop any Upwork, Fiverr or Freelancer posting into Proposly AI.",
    },
    {
      icon: Sparkles,
      title: "Pick tone & platform",
      body: "Professional, Friendly, or Confident — tuned to each marketplace.",
    },
    {
      icon: Zap,
      title: "Generate & send",
      body: "A tailored proposal in seconds. Edit inline, copy, or export as PDF.",
    },
  ];
  return (
    <section id="how" className="py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            Workflow
          </div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Three steps. Zero busywork.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Built for freelancers who bid all day.
          </p>
        </div>
        <div className="mt-16 grid gap-6 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div
              key={s.title}
              className="group rounded-2xl border border-border bg-surface p-8 shadow-xs transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="font-mono text-xs text-muted-foreground">0{i + 1}</div>
              <h3 className="mt-2 text-lg font-semibold tracking-tight">{s.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const quotes = [
    {
      name: "Sarah Chen",
      role: "Full-stack Developer",
      quote: "I went from writing 3 proposals a day to 15. My response rate doubled.",
    },
    {
      name: "Marcus Reid",
      role: "Brand Designer",
      quote: "The tone controls actually work. My Fiverr proposals sound like me — but sharper.",
    },
    {
      name: "Priya Patel",
      role: "SEO Consultant",
      quote: "Landed two retainers in the first week. This paid for itself instantly.",
    },
  ];
  return (
    <section className="border-t border-border/70 bg-surface/40 py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            Loved by freelancers
          </div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Real proposals. Real wins.
          </h2>
        </div>
        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {quotes.map((q) => (
            <figure
              key={q.name}
              className="rounded-2xl border border-border bg-surface p-8 shadow-xs"
            >
              <blockquote className="text-[15px] leading-relaxed text-foreground">
                "{q.quote}"
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-border pt-5">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-muted text-sm font-semibold text-foreground">
                  {q.name
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground">{q.name}</div>
                  <div className="text-xs text-muted-foreground">{q.role}</div>
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-28">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            Pricing
          </div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Simple, transparent pricing.
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Start free. Upgrade when you're winning.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-3xl gap-6 md:grid-cols-2">
          <PriceCard
            name="Free"
            price="$0"
            blurb="Generous enough to really test it."
            features={[
              "50 proposals / month",
              "All platforms & tones",
              "Save to history",
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
              "All 40+ proposal styles",
              "AI Rewrite, Optimizer & Proposal Score",
              "Cover letter & client-question answers",
              "English ↔ Urdu translator & more languages",
              "AI Freelancer Coach + chat history",
              "Priority AI, faster generation",
              "Unlimited PDF exports & history",
              "Future premium AI features included",
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
  disabled,
}: {
  name: string;
  price: string;
  blurb: string;
  features: string[];
  cta: string;
  highlighted?: boolean;
  disabled?: boolean;
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
          Popular
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
            <div className="mt-0.5 grid h-4 w-4 place-items-center rounded-full bg-primary/10">
              <Check className="h-3 w-3 text-primary" strokeWidth={3} />
            </div>
            <span className="text-foreground">{f}</span>
          </li>
        ))}
      </ul>
      <Button
        asChild
        className="mt-10 w-full"
        variant={highlighted ? "default" : "outline"}
        disabled={disabled}
        size="lg"
      >
        {disabled ? <span>{cta}</span> : <Link to="/auth">{cta}</Link>}
      </Button>
    </div>
  );
}

function FAQ() {
  const items = [
    {
      q: "How does the free plan work?",
      a: "You get 50 AI-generated proposals every calendar month. No credit card, no strings.",
    },
    {
      q: "Which platforms are supported?",
      a: "Upwork, Fiverr, and Freelancer are tuned in. Any generated proposal works everywhere.",
    },
    {
      q: "Can I edit the generated proposal?",
      a: "Yes — every proposal is editable inline before you copy, save, or export as PDF.",
    },
    {
      q: "Is my data private?",
      a: "Your proposals and job descriptions are only visible to you. We never share your data.",
    },
  ];
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="border-t border-border/70 bg-surface/40 py-28">
      <div className="mx-auto max-w-3xl px-6">
        <div className="text-center">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">FAQ</div>
          <h2 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">
            Frequently asked questions
          </h2>
        </div>
        <div className="mt-14 divide-y divide-border rounded-2xl border border-border bg-surface">
          {items.map((it, i) => {
            const isOpen = open === i;
            return (
              <div key={it.q}>
                <button
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-muted/40"
                >
                  <span className="text-[15px] font-medium text-foreground">{it.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm leading-relaxed text-muted-foreground">
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
    <section className="py-28">
      <div className="mx-auto max-w-4xl px-6">
        <div className="rounded-3xl border border-border bg-surface px-8 py-16 text-center shadow-sm sm:px-16">
          <h2 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Stop writing from scratch.
          </h2>
          <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">
            Join thousands of freelancers shipping better proposals with Proposly AI.
          </p>
          <Button asChild size="lg" className="mt-8">
            <Link to="/auth">
              Get started free
              <ArrowRight className="ml-0.5 h-4 w-4" />
            </Link>
          </Button>
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure & private
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" /> Setup in 30 seconds
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5" /> PDF export
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
            <Logo />
            <span className="text-sm font-semibold tracking-tight">{BRAND.name}</span>
          </div>
          <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground">
            <a href="#how" className="hover:text-foreground">
              How it works
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
          <div>© {new Date().getFullYear()} {BRAND.legalName}. All rights reserved. v{BRAND.version}</div>
          <div>AI-powered proposals for freelancers.</div>
        </div>
      </div>
    </footer>
  );
}
