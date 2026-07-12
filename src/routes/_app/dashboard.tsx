import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateProposal, getUsage } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Copy, Download, Save, RefreshCw, Lock, FileText, Zap, Clock } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Generate — Gigify" }] }),
  component: Dashboard,
});

const PLATFORMS = ["Upwork", "Fiverr", "Freelancer"] as const;
const TONES = ["Professional", "Friendly", "Confident"] as const;

function firstName(user: User | null) {
  if (!user) return "there";
  const meta = user.user_metadata as { full_name?: string; name?: string } | undefined;
  if (meta?.full_name) return meta.full_name.split(" ")[0];
  if (meta?.name) return meta.name.split(" ")[0];
  if (user.email) {
    return user.email.split("@")[0]
      .replace(/[._-]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return "there";
}

function Dashboard() {
  const { user } = useAuth();
  const [jobDescription, setJobDescription] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("Upwork");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Professional");
  const [result, setResult] = useState<string>("");
  const [limitHit, setLimitHit] = useState(false);

  const qc = useQueryClient();
  const genFn = useServerFn(generateProposal);
  const usageFn = useServerFn(getUsage);

  const usage = useQuery({ queryKey: ["usage"], queryFn: () => usageFn() });

  const generate = useMutation({
    mutationFn: () => genFn({ data: { jobDescription, platform, tone } }),
    onSuccess: (r) => {
      setResult(r.content);
      qc.invalidateQueries({ queryKey: ["usage"] });
      toast.success("Proposal ready");
    },
    onError: (e: Error) => {
      if (e.message.startsWith("FREE_LIMIT_REACHED")) { setLimitHit(true); return; }
      toast.error(e.message);
    },
  });

  async function save() {
    if (!result.trim()) return;
    const title = jobDescription.split("\n")[0].slice(0, 80) || "Untitled proposal";
    const { error } = await supabase.from("proposals").insert({
      user_id: (await supabase.auth.getUser()).data.user!.id,
      title, job_description: jobDescription, platform, tone, content: result,
    });
    if (error) return toast.error(error.message);
    toast.success("Saved to history");
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
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text(`${platform} proposal`, margin, y); y += 22;
    doc.setFontSize(11); doc.setFont("helvetica", "normal");
    lines.forEach((line: string) => {
      if (y > doc.internal.pageSize.getHeight() - margin) { doc.addPage(); y = margin; }
      doc.text(line, margin, y); y += 16;
    });
    doc.save(`gigify-${platform.toLowerCase()}-proposal.pdf`);
  }

  const used = usage.data?.used ?? 0;
  const limit = usage.data?.limit ?? 5;
  const remaining = Math.max(0, limit - used);
  const pct = Math.min(100, (used / limit) * 100);

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Generate a proposal</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight leading-snug sm:text-3xl">
          Welcome back, {firstName(user)} 👋 Ready to win your next client?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Paste the job, pick your angle, ship it.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={Zap} label="This month" value={`${used} / ${limit}`} sub={`${remaining} proposals left`} progress={pct} />
        <StatCard icon={FileText} label="Current plan" value="Free" sub="5 proposals / month" />
        <StatCard icon={Clock} label="Avg. generation" value="~8s" sub="Powered by AI" />
      </div>

      {/* Editor */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <section className="rounded-2xl border border-border bg-surface p-7 shadow-xs">
          <div className="mb-6">
            <h2 className="text-lg font-semibold tracking-tight">Job details</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Paste the full posting for best results.</p>
          </div>

          <div className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="job" className="text-sm font-medium text-foreground">Job description</Label>
              <Textarea
                id="job"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Paste the full job posting here…"
                className="min-h-[240px] resize-y"
              />
              {jobDescription.trim().length > 0 && jobDescription.trim().length < 20 && (
                <p className="text-xs leading-relaxed text-muted-foreground">A bit more detail helps — at least 20 characters.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Platform</Label>
              <SegmentedControl options={PLATFORMS} value={platform} onChange={setPlatform} />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">Tone</Label>
              <SegmentedControl options={TONES} value={tone} onChange={setTone} />
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={generate.isPending || jobDescription.trim().length < 20}
              onClick={() => generate.mutate()}
            >
              {generate.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating…</>
              ) : (
                <><Sparkles className="mr-2 h-4 w-4" />Generate proposal</>
              )}
            </Button>
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-surface p-7 shadow-xs">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Your proposal</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Edit inline, then copy, save, or export.</p>
            </div>
            {result && (
              <div className="flex flex-wrap items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => generate.mutate()} disabled={generate.isPending} aria-label="Regenerate">
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={copy} aria-label="Copy"><Copy className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={download} aria-label="Download"><Download className="h-4 w-4" /></Button>
                <Button size="sm" onClick={save}><Save className="mr-1.5 h-3.5 w-3.5" />Save</Button>
              </div>
            )}
          </div>

          {generate.isPending ? (
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
            />
          ) : (
            <div className="grid min-h-[360px] place-items-center rounded-xl border border-dashed border-border bg-[#FAFAF7] text-center">
              <div className="max-w-xs px-6">
                <div className="mx-auto mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="text-sm font-semibold text-foreground">Your proposal will appear here</div>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">Fill in the job details and hit Generate.</p>
              </div>
            </div>
          )}
        </section>
      </div>

      {limitHit && <UpgradeDialog onClose={() => setLimitHit(false)} />}
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, progress,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; sub: string; progress?: number;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 shadow-xs">
      <div className="flex items-start justify-between">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
        <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/8 text-primary">
          <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-4 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
      <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{sub}</div>
      {progress !== undefined && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}

function SegmentedControl<T extends string>({
  options, value, onChange,
}: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-[#FAFAF7] p-1">
      {options.map((o) => {
        const active = value === o;
        return (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-all ${
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
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm animate-fade-up">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-lg">
        <div className="mb-4 grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
          <Lock className="h-5 w-5" />
        </div>
        <h2 className="text-xl font-semibold tracking-tight">You've hit the free limit</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          You've used all 5 proposals this month. Upgrade to Pro for unlimited generations, priority AI, and extended history.
        </p>
        <div className="mt-6 flex gap-2">
          <Button className="flex-1" disabled>Upgrade to Pro (soon)</Button>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-5 text-center text-xs text-muted-foreground">
          <Link to="/history" className="hover:text-foreground">View your saved proposals →</Link>
        </div>
      </div>
    </div>
  );
}
