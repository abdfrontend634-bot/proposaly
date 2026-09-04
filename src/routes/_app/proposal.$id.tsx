import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  getProposal,
  updateProposal,
  duplicateProposal,
  deleteProposal,
  STATUSES,
} from "@/lib/proposals.functions";
import { exportProposalPdf, exportProposalTxt } from "@/lib/export-proposal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Copy,
  CopyPlus,
  Download,
  FileType2,
  Loader2,
  Save,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "@/lib/brand";
import type { ProposalScore, JobAnalysis } from "@/lib/ai.functions";

export const Route = createFileRoute("/_app/proposal/$id")({
  head: () => ({
    meta: [
      { title: `Proposal — ${BRAND.name}` },
      {
        name: "description",
        content: "Edit, score-review, export or duplicate a saved proposal in Proposly AI.",
      },
    ],
  }),
  component: ProposalDetail,
});

const statusLabel: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  won: "Won",
  lost: "Lost",
};

function ProposalDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const getFn = useServerFn(getProposal);
  const updateFn = useServerFn(updateProposal);
  const dupFn = useServerFn(duplicateProposal);
  const delFn = useServerFn(deleteProposal);

  const query = useQuery({
    queryKey: ["proposal", id],
    queryFn: () => getFn({ data: { id } }),
  });

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<string>("draft");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (query.data && !hydrated) {
      setTitle(query.data.title);
      setContent(query.data.content);
      setStatus(query.data.status);
      setHydrated(true);
    }
  }, [query.data, hydrated]);

  const dirty =
    !!query.data &&
    (title !== query.data.title || content !== query.data.content || status !== query.data.status);

  const save = useMutation({
    mutationFn: () =>
      updateFn({
        data: {
          id,
          title: title.trim(),
          content: content.trim(),
          status: status as (typeof STATUSES)[number],
        },
      }),
    onSuccess: async () => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["proposal", id] }),
        qc.invalidateQueries({ queryKey: ["proposals"] }),
      ]);
      toast.success("Changes saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const duplicate = useMutation({
    mutationFn: () => dupFn({ data: { id } }),
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Duplicated");
      navigate({ to: "/proposal/$id", params: { id: r.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: () => delFn({ data: { id } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Deleted");
      navigate({ to: "/history", replace: true });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (query.isPending) {
    return (
      <div className="space-y-6" aria-busy="true" aria-label="Loading proposal">
        <div className="h-4 w-24 rounded shimmer" />
        <div className="h-8 w-2/3 rounded shimmer" />
        <div className="h-64 w-full rounded-2xl shimmer" />
      </div>
    );
  }

  if (query.isError) {
    return (
      <div className="rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-danger/10">
          <AlertTriangle className="h-5 w-5 text-danger" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">
          {(query.error as Error).message}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          <Button size="sm" variant="outline" onClick={() => query.refetch()}>
            Try again
          </Button>
          <Button asChild size="sm">
            <Link to="/history">Back to history</Link>
          </Button>
        </div>
      </div>
    );
  }

  const proposal = query.data!;
  const score = (proposal.score ?? null) as ProposalScore | null;
  const analysis = (proposal.analysis ?? null) as JobAnalysis | null;
  const matches = (proposal.matched_portfolio ?? null) as Array<{
    id: string;
    name: string;
    reason: string;
  }> | null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          to="/history"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Back to history
        </Link>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight leading-snug sm:text-3xl">
          Edit proposal
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Saved {new Date(proposal.created_at).toLocaleString()} · {proposal.platform} ·{" "}
          {proposal.tone} · {proposal.length}
        </p>
      </div>

      <section className="space-y-5 rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-7">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={160}
          />
        </div>

        <div className="space-y-2">
          <span className="block text-sm font-medium">Status</span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Proposal status">
            {STATUSES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStatus(s)}
                aria-pressed={status === s}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                  status === s
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {statusLabel[s]}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Proposal</Label>
          <textarea
            id="content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={16}
            className="w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-[15px] leading-[1.7] text-foreground outline-none transition-colors focus-visible:border-primary"
          />
          <p className="text-xs text-muted-foreground">
            {content.trim().split(/\s+/).filter(Boolean).length} words
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => save.mutate()} disabled={!dirty || save.isPending}>
            {save.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save changes
          </Button>
          <Button
            variant="outline"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(content);
                toast.success("Copied");
              } catch {
                toast.error("Couldn't copy to clipboard.");
              }
            }}
          >
            <Copy className="mr-2 h-4 w-4" /> Copy
          </Button>
          <Button variant="outline" onClick={() => exportProposalPdf(title, content)}>
            <Download className="mr-2 h-4 w-4" /> PDF
          </Button>
          <Button variant="outline" onClick={() => exportProposalTxt(title, content)}>
            <FileType2 className="mr-2 h-4 w-4" /> Text
          </Button>
          <Button variant="outline" onClick={() => duplicate.mutate()} disabled={duplicate.isPending}>
            {duplicate.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CopyPlus className="mr-2 h-4 w-4" />
            )}
            Duplicate
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              if (window.confirm("Delete this proposal? This can't be undone.")) remove.mutate();
            }}
            disabled={remove.isPending}
          >
            <Trash2 className="mr-2 h-4 w-4 text-danger" /> Delete
          </Button>
        </div>
      </section>

      {score && score.dimensions.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-7">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-lg font-semibold tracking-tight">Quality review</h2>
            <div className="text-2xl font-semibold text-primary">{score.overall}/100</div>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Recorded when this proposal was generated.
          </p>
          <ul className="mt-5 space-y-3">
            {score.dimensions.map((d) => (
              <li key={d.name}>
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium text-foreground">{d.name}</span>
                  <span className="text-muted-foreground">{d.score}</span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${d.score}%` }} />
                </div>
                {d.note && <p className="mt-1.5 text-xs text-muted-foreground">{d.note}</p>}
              </li>
            ))}
          </ul>
          {score.recommendations.length > 0 && (
            <div className="mt-6 rounded-xl border border-border bg-surface-soft p-4">
              <div className="text-sm font-medium text-foreground">Suggested improvements</div>
              <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
                {score.recommendations.map((r, i) => (
                  <li key={i}>· {r}</li>
                ))}
              </ul>
            </div>
          )}
        </section>
      )}

      {matches && matches.length > 0 && (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight">Portfolio referenced</h2>
          <ul className="mt-4 space-y-3">
            {matches.map((m) => (
              <li key={m.id} className="rounded-xl border border-border bg-surface-soft p-4">
                <div className="text-sm font-medium text-foreground">{m.name}</div>
                {m.reason && <p className="mt-1 text-sm text-muted-foreground">{m.reason}</p>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {analysis && (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight">Job analysis</h2>
          {analysis.summary && (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{analysis.summary}</p>
          )}
          <div className="mt-5 grid gap-5 sm:grid-cols-2">
            <Facts label="Client needs" items={analysis.clientNeeds} />
            <Facts label="Required skills" items={analysis.requiredSkills} />
            <Facts label="Technologies" items={analysis.technologies} />
            <Facts label="Deliverables" items={analysis.deliverables} />
            <Facts label="Priorities" items={analysis.priorities} />
            <Facts label="Likely concerns" items={analysis.concerns} />
          </div>
        </section>
      )}

      {proposal.job_description && (
        <section className="rounded-2xl border border-border bg-surface p-5 shadow-xs sm:p-7">
          <h2 className="text-lg font-semibold tracking-tight">Original job description</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-[1.7] text-muted-foreground">
            {proposal.job_description}
          </p>
        </section>
      )}
    </div>
  );
}

function Facts({ label, items }: { label: string; items?: string[] }) {
  if (!items || items.length === 0) return null;
  return (
    <div className="min-w-0">
      <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        {label}
      </div>
      <ul className="mt-2 space-y-1 text-sm text-foreground">
        {items.map((i, idx) => (
          <li key={idx} className="break-words">
            · {i}
          </li>
        ))}
      </ul>
    </div>
  );
}
