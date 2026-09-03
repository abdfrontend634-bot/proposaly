import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  analyzeJob,
  generateProposal,
  getUsage,
  refineProposal,
  scoreProposal,
  PLATFORMS,
  TONES,
  LENGTHS,
  REFINE_ACTIONS,
  type JobAnalysis,
  type PortfolioMatch,
  type ProposalScore,
} from "@/lib/ai.functions";
import { getSubscription } from "@/lib/billing.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { useFounder } from "@/lib/use-founder";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Sparkles,
  Copy,
  Download,
  Save,
  RefreshCw,
  Lock,
  FileText,
  Zap,
  Clock,
  Crown,
  ArrowRight,
  MessageSquare,
  Search,
  Gauge,
  Check,
  FolderOpen,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({
    meta: [
      { title: "Generate a proposal — Proposly AI" },
      {
        name: "description",
        content:
          "Analyze a job posting, match it to your saved portfolio, and write a proposal that fits the role.",
      },
      { property: "og:title", content: "Generate a proposal — Proposly AI" },
      {
        property: "og:description",
        content: "Job analysis, portfolio matching, and proposal drafting in one flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

const PRO_FEATURES = [
  "40+ proposal styles",
  "AI Proposal Rewrite",
  "AI Proposal Optimizer",
  "Proposal Score",
  "AI Suggestions",
  "Cover Letter Generator",
  "Client Questions Auto Answer",
  "Urdu & multi-language translator",
  "English Simplifier",
  "AI Freelancer Coach",
  "Chat history",
  "Priority AI + faster generation",
] as const;

function firstName(user: User | null) {
  if (!user) return "there";
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  if (meta?.full_name) return meta.full_name.split(" ")[0];
  if (meta?.name) return meta.name.split(" ")[0];
  if (user.email) {
    return user.email
      .split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "there";
}

function Dashboard() {
  const { user } = useAuth();
  const { isFounder } = useFounder();
  const [jobDescription, setJobDescription] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("Upwork");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Professional");
  const [length, setLength] = useState<(typeof LENGTHS)[number]>("Standard");
  const [result, setResult] = useState<string>("");
  const [limitHit, setLimitHit] = useState(false);

  const [analysis, setAnalysis] = useState<JobAnalysis | null>(null);
  const [matches, setMatches] = useState<PortfolioMatch[]>([]);
  const [selectedMatches, setSelectedMatches] = useState<string[]>([]);
  const [hasPortfolio, setHasPortfolio] = useState(true);
  const [score, setScore] = useState<ProposalScore | null>(null);

  const qc = useQueryClient();
  const analyzeFn = useServerFn(analyzeJob);
  const genFn = useServerFn(generateProposal);
  const refineFn = useServerFn(refineProposal);
  const scoreFn = useServerFn(scoreProposal);
  const usageFn = useServerFn(getUsage);
  const subFn = useServerFn(getSubscription);

  const usage = useQuery({ queryKey: ["usage"], queryFn: () => usageFn() });
  const subscription = useQuery({ queryKey: ["subscription"], queryFn: () => subFn() });

  function onError(e: Error) {
    if (e.message.startsWith("FREE_LIMIT_REACHED")) {
      setLimitHit(true);
      return;
    }
    toast.error(e.message);
  }

  const analyze = useMutation({
    mutationFn: () => analyzeFn({ data: { jobDescription } }),
    onSuccess: (r) => {
      setAnalysis(r.analysis);
      setMatches(r.matches);
      setSelectedMatches(r.matches.map((m) => m.id));
      setHasPortfolio(r.hasPortfolio);
      toast.success("Job analyzed");
    },
    onError,
  });

  const generate = useMutation({
    mutationFn: () =>
      genFn({
        data: {
          jobDescription,
          platform,
          tone,
          length,
          analysis: analysis ?? undefined,
          matchIds: selectedMatches,
        },
      }),
    onSuccess: (r) => {
      setResult(r.content);
      setScore(null);
      qc.invalidateQueries({ queryKey: ["usage"] });
      toast.success("Proposal ready");
    },
    onError,
  });

  const refine = useMutation({
    mutationFn: (action: (typeof REFINE_ACTIONS)[number]) =>
      refineFn({ data: { content: result, jobDescription, action } }),
    onSuccess: (r) => {
      setResult(r.content);
      setScore(null);
      qc.invalidateQueries({ queryKey: ["usage"] });
      toast.success("Proposal updated");
    },
    onError,
  });

  const review = useMutation({
    mutationFn: () => scoreFn({ data: { content: result, jobDescription } }),
    onSuccess: (r) => setScore(r),
    onError,
  });

  const [saving, setSaving] = useState(false);
  async function save() {
    if (!result.trim() || saving) return;
    setSaving(true);
    try {
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        toast.error("Please sign in again.");
        return;
      }
      const title = jobDescription.split("\n")[0].slice(0, 80) || "Untitled proposal";
      const { error } = await supabase.from("proposals").insert({
        user_id: userData.user.id,
        title,
        job_description: jobDescription,
        platform,
        tone,
        length,
        content: result,
        analysis: analysis ? (analysis as unknown as never) : null,
        matched_portfolio: matches.length
          ? (matches.filter((m) => selectedMatches.includes(m.id)) as unknown as never)
          : null,
        score: score ? (score as unknown as never) : null,
      });
      if (error) {
        toast.error("Couldn't save. Please try again.");
        return;
      }
      qc.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Saved to history");
    } finally {
      setSaving(false);
    }
  }

  function copy() {
    navigator.clipboard.writeText(result);
    toast.success("Copied to clipboard");
  }

  function download() {
    const doc = new jsPDF({ unit: "pt", format: "letter" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    const margin = 56;
    const w = doc.internal.pageSize.getWidth() - margin * 2;
    const lines = doc.splitTextToSize(result, w);
    let y = margin;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${platform} proposal`, margin, y);
    y += 22;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    lines.forEach((line: string) => {
      if (y > doc.internal.pageSize.getHeight() - margin) {
        doc.addPage();
        y = margin;
      }
      doc.text(line, margin, y);
      y += 16;
    });
    doc.save(`proposly-ai-${platform.toLowerCase()}-proposal.pdf`);
  }

  const used = usage.data?.used ?? 0;
  const limit = usage.data?.limit ?? 50;
  const isPro = subscription.data?.isPro ?? false;
  const remaining = isPro ? Infinity : Math.max(0, limit - used);
  const pct = isPro ? 0 : Math.min(100, (used / limit) * 100);
  const busy = analyze.isPending || generate.isPending || refine.isPending;
  const jobReady = jobDescription.trim().length >= 20;

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">
          Generate a proposal
        </div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight leading-snug sm:text-3xl">
          {isFounder
            ? "Welcome back, Founder Abdullah."
            : `Welcome back, ${firstName(user)} 👋 Ready to win your next client?`}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Paste the job, analyze it, match your work, then write the proposal.
        </p>
      </div>

      {/* AI Assistant — founder only */}
      {isFounder && (
        <Link
          to="/chat"
          className="group flex items-center justify-between gap-4 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 transition-all hover:border-primary/30 hover:bg-primary/8 sm:px-6 sm:py-5"
        >
          <div className="flex items-center gap-3.5">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <MessageSquare className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-foreground">AI Assistant</div>
              <div className="text-sm text-muted-foreground">
                Ask follow-ups, refine your proposal, or get freelance advice.
              </div>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1 text-sm font-medium text-primary">
            Open chat
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </Link>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          icon={Zap}
          label="This month"
          value={isPro ? "∞" : `${used} / ${limit}`}
          sub={isPro ? "Unlimited proposals" : `${remaining} proposals left`}
          progress={isPro ? undefined : pct}
        />
        <StatCard
          icon={isPro ? Crown : FileText}
          label="Current plan"
          value={isPro ? "Pro" : "Free"}
          sub={isPro ? "Unlimited access" : "50 proposals / month"}
        />
        <StatCard icon={Clock} label="Avg. generation" value="~8s" sub="Powered by AI" />
      </div>

      {!isPro && (
        <div className="space-y-4 rounded-2xl border border-primary/20 bg-primary/5 px-6 py-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary/10 text-primary">
                <Crown className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-semibold text-foreground">Unlock Proposly AI Pro</div>
                <div className="text-sm text-muted-foreground">
                  Unlimited proposals plus the full premium AI toolkit.
                </div>
              </div>
            </div>
            <Button asChild className="shrink-0">
              <Link to="/upgrade">
                Upgrade <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {PRO_FEATURES.map((f) => (
              <li
                key={f}
                className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-muted-foreground"
              >
                <Lock className="h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span className="truncate">{f}</span>
                <span className="ml-auto shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                  Pro
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Stage indicator */}
      <ol className="flex flex-wrap items-center gap-2 text-xs font-medium">
        {[
          { label: "1. Job", done: jobReady },
          { label: "2. Analysis", done: !!analysis },
          { label: "3. Portfolio match", done: selectedMatches.length > 0 },
          { label: "4. Proposal", done: !!result },
        ].map((s) => (
          <li
            key={s.label}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 ${
              s.done
                ? "border-primary/30 bg-primary/10 text-primary"
                : "border-border bg-surface text-muted-foreground"
            }`}
          >
            {s.done && <Check className="h-3 w-3" aria-hidden="true" />}
            {s.label}
          </li>
        ))}
      </ol>

      {/* Editor */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="rounded-2xl border border-border bg-surface p-7 shadow-xs">
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-tight">Job details</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Paste the full posting for best results.
            </p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="job" className="text-sm font-medium text-foreground">
                Job description
              </Label>
              <Textarea
                id="job"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job posting here…"
                className="min-h-[240px] resize-y"
                maxLength={8000}
                aria-describedby="job-help"
              />
              <div
                id="job-help"
                className="flex items-center justify-between gap-2 text-xs leading-relaxed text-muted-foreground"
              >
                <span>
                  {jobDescription.trim().length > 0 && jobDescription.trim().length < 20
                    ? "A bit more detail helps — at least 20 characters."
                    : "Minimum 20 characters."}
                </span>
                <span aria-live="polite">{jobDescription.length} / 8000</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Platform</Label>
              <SegmentedControl options={PLATFORMS} value={platform} onChange={setPlatform} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Tone</Label>
              <SegmentedControl options={TONES} value={tone} onChange={setTone} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Length</Label>
              <SegmentedControl options={LENGTHS} value={length} onChange={setLength} />
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                size="lg"
                disabled={busy || jobDescription.trim().length < 40}
                onClick={() => analyze.mutate()}
              >
                {analyze.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing…
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Analyze job
                  </>
                )}
              </Button>
              <Button size="lg" disabled={busy || !jobReady} onClick={() => generate.mutate()}>
                {generate.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate proposal
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Analyzing first is optional, but it lets the proposal use the client's own priorities
              and your matching work.
            </p>
          </div>

          {analysis && (
            <div className="mt-7 space-y-5 border-t border-border pt-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground">What this client wants</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {analysis.summary || analysis.projectType}
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <TagList title="Client needs" items={analysis.clientNeeds} />
                <TagList title="Required skills" items={analysis.requiredSkills} />
                <TagList title="Technologies" items={analysis.technologies} />
                <TagList title="Deliverables" items={analysis.deliverables} />
                <TagList title="Priorities" items={analysis.priorities} />
                <TagList title="Likely concerns" items={analysis.concerns} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground">Portfolio match</h3>
                {matches.length ? (
                  <ul className="mt-2 space-y-2">
                    {matches.map((m) => {
                      const on = selectedMatches.includes(m.id);
                      return (
                        <li key={m.id}>
                          <button
                            type="button"
                            aria-pressed={on}
                            onClick={() =>
                              setSelectedMatches((prev) =>
                                prev.includes(m.id)
                                  ? prev.filter((x) => x !== m.id)
                                  : [...prev, m.id],
                              )
                            }
                            className={`w-full rounded-xl border px-4 py-3 text-left transition-all ${
                              on
                                ? "border-primary/30 bg-primary/5"
                                : "border-border bg-surface-soft hover:border-primary/20"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-foreground">{m.name}</span>
                              {on && <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />}
                            </div>
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {m.reason}
                            </p>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="mt-2 rounded-xl border border-dashed border-border bg-surface-soft px-4 py-4 text-sm text-muted-foreground">
                    {hasPortfolio ? (
                      "None of your saved projects clearly fit this posting."
                    ) : (
                      <span className="inline-flex flex-wrap items-center gap-1">
                        <FolderOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                        Add your work to the
                        <Link to="/portfolio" className="font-medium text-primary hover:underline">
                          Portfolio Vault
                        </Link>
                        so proposals can reference real projects.
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface p-7 shadow-xs">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Your proposal</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Edit inline, refine with AI, then copy, save, or export.
              </p>
            </div>
            {result && (
              <div className="flex flex-wrap items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => generate.mutate()}
                  disabled={busy}
                  aria-label="Regenerate"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={copy} aria-label="Copy">
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={download} aria-label="Download">
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="sm" onClick={save} disabled={saving}>
                  {saving ? (
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="mr-1.5 h-3.5 w-3.5" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>

          {generate.isPending || refine.isPending ? (
            <div className="space-y-3">
              <div className="h-3 w-full rounded-md shimmer" />
              <div className="h-3 w-11/12 rounded-md shimmer" />
              <div className="h-3 w-full rounded-md shimmer" />
              <div className="h-3 w-8/12 rounded-md shimmer" />
              <div className="h-3 w-10/12 rounded-md shimmer" />
              <div className="h-3 w-9/12 rounded-md shimmer" />
            </div>
          ) : result ? (
            <Textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="min-h-[360px] resize-y bg-background text-[15px] leading-[1.7]"
              aria-label="Generated proposal"
            />
          ) : (
            <div className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-border bg-surface-soft text-center">
              <div className="max-w-xs px-6">
                <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-foreground">
                  Your proposal will appear here
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  Fill in the job details and hit Generate.
                </p>
              </div>
            </div>
          )}

          {result && (
            <div className="mt-6 space-y-5 border-t border-border pt-6">
              <div>
                <h3 className="text-sm font-semibold text-foreground">Refine</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {REFINE_ACTIONS.map((a) => (
                    <button
                      key={a}
                      type="button"
                      disabled={busy}
                      onClick={() => refine.mutate(a)}
                      className="rounded-full border border-border bg-surface-soft px-3 py-1.5 text-xs font-medium text-muted-foreground transition-all hover:border-primary/30 hover:text-primary disabled:opacity-50"
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">Quality score</h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => review.mutate()}
                    disabled={review.isPending}
                  >
                    {review.isPending ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Gauge className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    {score ? "Re-run review" : "Review proposal"}
                  </Button>
                </div>

                {score && (
                  <div className="mt-3 space-y-4 rounded-xl border border-border bg-surface-soft p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-semibold tracking-tight text-foreground">
                        {score.overall}
                      </span>
                      <span className="text-sm text-muted-foreground">/ 100</span>
                    </div>
                    <ul className="space-y-2">
                      {score.dimensions.map((d) => (
                        <li key={d.name}>
                          <div className="flex items-center justify-between gap-2 text-xs font-medium text-foreground">
                            <span>{d.name}</span>
                            <span className="text-muted-foreground">{d.score}</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                            <div
                              className="h-full rounded-full bg-primary"
                              style={{ width: `${d.score}%` }}
                            />
                          </div>
                          {d.note && (
                            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                              {d.note}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                    {score.recommendations.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          What to fix
                        </div>
                        <ul className="mt-2 space-y-1.5">
                          {score.recommendations.map((r, i) => (
                            <li
                              key={i}
                              className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                            >
                              <ArrowRight
                                className="mt-0.5 h-3 w-3 shrink-0 text-primary"
                                aria-hidden="true"
                              />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {limitHit && <UpgradeDialog onClose={() => setLimitHit(false)} />}
    </div>
  );
}

function TagList({ title, items }: { title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {items.map((i) => (
          <span
            key={i}
            className="rounded-full border border-border bg-surface-soft px-2.5 py-1 text-xs text-foreground"
          >
            {i}
          </span>
        ))}
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  progress,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  sub: string;
  progress?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/8 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{sub}</div>
      {progress !== undefined && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly T[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-soft p-1">
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(o)}
            className={`min-h-9 flex-1 rounded-md px-3 py-2 text-sm font-medium transition-all ${
              active
                ? "bg-surface text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function UpgradeDialog({ onClose }: { onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm animate-fade-up"
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <h2 id="limit-title" className="text-xl font-semibold tracking-tight">
          You've hit the free limit
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          You've used all 50 proposals this month. Upgrade to Pro for unlimited generations, priority
          AI, and extended history.
        </p>
        <div className="mt-6 flex gap-2">
          <Button asChild className="flex-1">
            <Link to="/upgrade">Upgrade to Pro</Link>
          </Button>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
        <div className="mt-5 text-center text-xs text-muted-foreground">
          <Link to="/history" className="hover:text-foreground">
            View your saved proposals →
          </Link>
        </div>
      </div>
    </div>
  );
}
