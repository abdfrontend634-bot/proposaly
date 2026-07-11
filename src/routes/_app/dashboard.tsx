import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { generateProposal, getUsage } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Copy, Download, Save, RefreshCw, Lock } from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";

export const Route = createFileRoute("/_app/dashboard")({
  head: () => ({ meta: [{ title: "Generate — Gigify" }] }),
  component: Dashboard,
});

const PLATFORMS = ["Upwork", "Fiverr", "Freelancer"] as const;
const TONES = ["Professional", "Friendly", "Confident"] as const;

function Dashboard() {
  const [jobDescription, setJobDescription] = useState("");
  const [platform, setPlatform] = useState<(typeof PLATFORMS)[number]>("Upwork");
  const [tone, setTone] = useState<(typeof TONES)[number]>("Professional");
  const [result, setResult] = useState<string>("");
  const [limitHit, setLimitHit] = useState(false);

  const qc = useQueryClient();
  const genFn = useServerFn(generateProposal);
  const usageFn = useServerFn(getUsage);

  const usage = useQuery({
    queryKey: ["usage"],
    queryFn: () => usageFn(),
  });

  const generate = useMutation({
    mutationFn: () => genFn({ data: { jobDescription, platform, tone } }),
    onSuccess: (r) => {
      setResult(r.content);
      qc.invalidateQueries({ queryKey: ["usage"] });
      toast.success("Proposal ready");
    },
    onError: (e: Error) => {
      if (e.message.startsWith("FREE_LIMIT_REACHED")) {
        setLimitHit(true);
        return;
      }
      toast.error(e.message);
    },
  });

  async function save() {
    if (!result.trim()) return;
    const title = jobDescription.split("\n")[0].slice(0, 80) || "Untitled proposal";
    const { error } = await supabase.from("proposals").insert({
      user_id: (await supabase.auth.getUser()).data.user!.id,
      title,
      job_description: jobDescription,
      platform, tone,
      content: result,
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

  const remaining = usage.data ? Math.max(0, usage.data.limit - usage.data.used) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Generate a proposal</h1>
          <p className="mt-1 text-sm text-muted-foreground">Paste the job. Pick your angle. Ship it.</p>
        </div>
        {usage.data && (
          <div className="rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
            {remaining} / {usage.data.limit} proposals left this month
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-surface/40 p-5">
          <Label htmlFor="job" className="text-sm">Job description</Label>
          <Textarea
            id="job"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the full job posting here…"
            className="mt-2 min-h-[220px] resize-y bg-background"
          />

          <div className="mt-5 grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm">Platform</Label>
              <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-background p-1">
                {PLATFORMS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPlatform(p)}
                    className={`rounded-md px-2 py-1.5 text-xs font-medium transition ${
                      platform === p ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >{p}</button>
                ))}
              </div>
            </div>
            <div>
              <Label className="text-sm">Tone</Label>
              <div className="mt-2 grid grid-cols-3 gap-1.5 rounded-lg border border-border bg-background p-1">
                {TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`rounded-md px-2 py-1.5 text-xs font-medium transition ${
                      tone === t ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >{t}</button>
                ))}
              </div>
            </div>
          </div>

          <Button
            className="mt-5 w-full"
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
          {jobDescription.trim().length > 0 && jobDescription.trim().length < 20 && (
            <p className="mt-2 text-xs text-muted-foreground">A bit more detail helps — at least 20 characters.</p>
          )}
        </section>

        <section className="rounded-2xl border border-border bg-surface/40 p-5">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Your proposal</Label>
            {result && (
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={() => generate.mutate()} disabled={generate.isPending}>
                  <RefreshCw className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={copy}><Copy className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="sm" onClick={download}><Download className="h-3.5 w-3.5" /></Button>
                <Button variant="default" size="sm" onClick={save}><Save className="mr-1.5 h-3.5 w-3.5" />Save</Button>
              </div>
            )}
          </div>

          {generate.isPending ? (
            <div className="mt-3 space-y-2">
              <div className="h-3 w-full rounded shimmer" />
              <div className="h-3 w-11/12 rounded shimmer" />
              <div className="h-3 w-full rounded shimmer" />
              <div className="h-3 w-8/12 rounded shimmer" />
              <div className="h-3 w-10/12 rounded shimmer" />
            </div>
          ) : result ? (
            <Textarea
              value={result}
              onChange={(e) => setResult(e.target.value)}
              className="mt-2 min-h-[320px] resize-y bg-background font-[450] leading-relaxed"
            />
          ) : (
            <div className="mt-3 grid min-h-[320px] place-items-center rounded-lg border border-dashed border-border/60 bg-background/50 text-center text-sm text-muted-foreground">
              <div className="max-w-xs px-6">
                <Sparkles className="mx-auto mb-2 h-5 w-5 text-brand" />
                Your generated proposal will appear here. Edit inline, copy, download, or save.
              </div>
            </div>
          )}
        </section>
      </div>

      {limitHit && <UpgradeDialog onClose={() => setLimitHit(false)} />}
    </div>
  );
}

function UpgradeDialog({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm animate-fade-up rounded-2xl border border-border bg-surface p-6 shadow-glow">
        <div className="mb-3 grid h-10 w-10 place-items-center rounded-lg bg-brand/15 text-brand ring-1 ring-inset ring-brand/30">
          <Lock className="h-4 w-4" />
        </div>
        <h2 className="text-lg font-semibold">You've hit the free limit</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          You've used all 5 proposals this month. Upgrade to Pro for unlimited generations.
        </p>
        <div className="mt-5 flex gap-2">
          <Button className="flex-1" disabled>Upgrade to Pro (soon)</Button>
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
        <div className="mt-4 text-center text-xs text-muted-foreground">
          <Link to="/history" className="hover:text-foreground">View your saved proposals →</Link>
        </div>
      </div>
    </div>
  );
}
