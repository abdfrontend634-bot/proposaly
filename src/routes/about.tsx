import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Mail, Globe, MapPin, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Lockup } from "@/components/brand";
import { BRAND, DEVELOPER } from "@/lib/brand";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: `About the developer — ${BRAND.name}` },
      {
        name: "description",
        content: `Meet the developer behind ${BRAND.name}, the AI proposal generator built for freelancers who bid every day.`,
      },
      { property: "og:title", content: `About the developer — ${BRAND.name}` },
      {
        property: "og:description",
        content: `Meet the developer behind ${BRAND.name}, the AI proposal generator built for freelancers.`,
      },
      { property: "og:type", content: "profile" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-surface/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-6">
          <Link to="/" aria-label={`${BRAND.name} home`}>
            <Lockup textClassName="text-[17px]" />
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link to="/">
              <ArrowLeft className="mr-1.5 h-4 w-4" /> Back home
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-20">
        <div className="animate-fade-up">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            About the developer
          </div>
          <h1 className="mt-3 max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
            {DEVELOPER.name}
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">{DEVELOPER.role}</p>
          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {DEVELOPER.location}
            </span>
            <a
              href={`mailto:${DEVELOPER.email}`}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Mail className="h-3.5 w-3.5" /> {DEVELOPER.email}
            </a>
            <a
              href={DEVELOPER.website}
              className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
            >
              <Globe className="h-3.5 w-3.5" /> {DEVELOPER.website.replace(/^https?:\/\//, "")}
            </a>
          </div>
        </div>

        <section className="mt-12 rounded-2xl border border-border bg-surface p-8 shadow-xs">
          <h2 className="text-lg font-semibold tracking-tight">The story</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{DEVELOPER.bio}</p>
        </section>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <section className="rounded-2xl border border-border bg-surface p-8 shadow-xs">
            <h2 className="text-lg font-semibold tracking-tight">What I focus on</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {DEVELOPER.focus.map((f) => (
                <li key={f} className="flex items-start gap-2.5">
                  <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-2xl border border-border bg-surface p-8 shadow-xs">
            <h2 className="text-lg font-semibold tracking-tight">Built with</h2>
            <ul className="mt-4 flex flex-wrap gap-2">
              {DEVELOPER.stack.map((s) => (
                <li
                  key={s}
                  className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {s}
                </li>
              ))}
            </ul>
            <div className="mt-6 rounded-xl border border-gold/30 bg-gold-soft px-4 py-3 text-xs leading-relaxed text-foreground">
              {BRAND.name} v{BRAND.version} — {BRAND.tagline}.
            </div>
          </section>
        </div>

        <section className="mt-10 rounded-2xl border border-border bg-surface px-8 py-12 text-center shadow-sm">
          <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Try {BRAND.name} for free
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            50 AI proposals every month, no credit card required.
          </p>
          <Button asChild size="lg" className="mt-7">
            <Link to="/auth">
              Get started <ArrowRight className="ml-0.5 h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-border/70 py-10">
        <div className="mx-auto max-w-4xl px-6 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {BRAND.legalName}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
