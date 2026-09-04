import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listProposals,
  duplicateProposal,
  deleteProposal,
  STATUSES,
  type ProposalRow,
} from "@/lib/proposals.functions";
import { PLATFORMS } from "@/lib/ai.functions";
import { exportProposalPdf, exportProposalTxt } from "@/lib/export-proposal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash2,
  Copy,
  Search,
  FileText,
  ChevronRight,
  CopyPlus,
  Download,
  FileType2,
  Pencil,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "@/lib/brand";

export const Route = createFileRoute("/_app/history")({
  head: () => ({
    meta: [
      { title: `Proposal history — ${BRAND.name}` },
      {
        name: "description",
        content:
          "Search, edit, duplicate and export every proposal you have saved in Proposly AI.",
      },
    ],
  }),
  component: HistoryPage,
});

const statusLabel: Record<string, string> = {
  draft: "Draft",
  sent: "Sent",
  won: "Won",
  lost: "Lost",
};

const statusClass: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  sent: "bg-primary/10 text-primary",
  won: "bg-success/12 text-success",
  lost: "bg-danger/10 text-danger",
};

function HistoryPage() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [platform, setPlatform] = useState<string>("All");
  const [status, setStatus] = useState<string>("All");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<ProposalRow | null>(null);

  const listFn = useServerFn(listProposals);
  const dupFn = useServerFn(duplicateProposal);
  const delFn = useServerFn(deleteProposal);

  const query = useQuery({
    queryKey: ["proposals"],
    queryFn: () => listFn(),
    staleTime: 30_000,
  });

  const items = query.data ?? [];

  const duplicate = useMutation({
    mutationFn: (id: string) => dupFn({ data: { id } }),
    onSuccess: async (r) => {
      await qc.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Duplicated");
      navigate({ to: "/proposal/$id", params: { id: r.id } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: async () => {
      setPendingDelete(null);
      await qc.invalidateQueries({ queryKey: ["proposals"] });
      toast.success("Deleted");
    },
    onError: (e: Error) => {
      setPendingDelete(null);
      toast.error(e.message);
    },
  });

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter((i) => {
      if (platform !== "All" && i.platform !== platform) return false;
      if (status !== "All" && i.status !== status) return false;
      if (!s) return true;
      return (
        i.title.toLowerCase().includes(s) ||
        i.content.toLowerCase().includes(s) ||
        (i.job_description ?? "").toLowerCase().includes(s)
      );
    });
  }, [items, q, platform, status]);

  async function copyContent(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied");
    } catch {
      toast.error("Couldn't copy to clipboard.");
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            Archive
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight leading-snug sm:text-3xl">
            Proposal history
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Search, edit, duplicate and export everything you've saved.
          </p>
        </div>
        <div className="text-sm leading-relaxed text-muted-foreground" aria-live="polite">
          {query.isPending
            ? "Loading…"
            : `${filtered.length} of ${items.length} ${items.length === 1 ? "proposal" : "proposals"}`}
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search title, proposal text or job description…"
            className="h-12 pl-11"
            aria-label="Search proposals"
          />
        </div>
        <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pb-1">
          <FilterGroup
            label="Platform"
            value={platform}
            onChange={setPlatform}
            options={["All", ...PLATFORMS]}
          />
          <FilterGroup
            label="Status"
            value={status}
            onChange={setStatus}
            options={["All", ...STATUSES]}
            format={(v) => statusLabel[v] ?? v}
          />
        </div>
      </div>

      {query.isPending ? (
        <div
          className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs"
          aria-busy="true"
          aria-label="Loading proposals"
        >
          <ul className="divide-y divide-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <li key={i} className="flex items-center gap-4 px-6 py-5">
                <div className="h-4 w-4 shrink-0 rounded shimmer" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-3.5 w-1/2 rounded shimmer" />
                  <div className="h-3 w-1/3 rounded shimmer" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : query.isError ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-8 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-danger/10">
            <AlertTriangle className="h-5 w-5 text-danger" />
          </div>
          <div className="mt-4 text-sm font-medium text-foreground">
            {(query.error as Error).message}
          </div>
          <div className="mt-5">
            <Button size="sm" variant="outline" onClick={() => query.refetch()}>
              Try again
            </Button>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface py-20 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 text-sm font-medium text-foreground">
            {items.length === 0 ? "No proposals saved yet" : "No matches"}
          </div>
          <p className="mx-auto mt-1 max-w-sm px-6 text-sm text-muted-foreground">
            {items.length === 0
              ? "Generate one from the dashboard and save it to build your archive."
              : "Try a different search or clear the filters."}
          </p>
          <div className="mt-6">
            {items.length === 0 ? (
              <Button asChild size="sm">
                <Link to="/dashboard">Generate a proposal</Link>
              </Button>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setQ("");
                  setPlatform("All");
                  setStatus("All");
                }}
              >
                Clear filters
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          <ul className="divide-y divide-border">
            {filtered.map((p) => {
              const open = openId === p.id;
              const busy = duplicate.isPending && duplicate.variables === p.id;
              return (
                <li key={p.id}>
                  <div className="group flex flex-wrap items-center gap-3 px-4 py-4 transition-colors hover:bg-surface-soft sm:gap-4 sm:px-6 sm:py-5">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : p.id)}
                      className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"
                      aria-expanded={open}
                      aria-controls={`proposal-${p.id}`}
                    >
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
                        aria-hidden="true"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-foreground">
                          {p.title}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="rounded-md bg-primary/8 px-2 py-0.5 font-medium text-primary">
                            {p.platform}
                          </span>
                          <span
                            className={`rounded-md px-2 py-0.5 font-medium ${statusClass[p.status] ?? statusClass["draft"]}`}
                          >
                            {statusLabel[p.status] ?? p.status}
                          </span>
                          <span>{p.tone}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {new Date(p.created_at).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        </div>
                      </div>
                    </button>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button variant="ghost" size="icon" asChild aria-label={`Edit ${p.title}`}>
                        <Link to="/proposal/$id" params={{ id: p.id }}>
                          <Pencil className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => copyContent(p.content)}
                        aria-label={`Copy ${p.title}`}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => duplicate.mutate(p.id)}
                        disabled={busy}
                        aria-label={`Duplicate ${p.title}`}
                      >
                        {busy ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <CopyPlus className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => exportProposalPdf(p.title, p.content)}
                        aria-label={`Export ${p.title} as PDF`}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => exportProposalTxt(p.title, p.content)}
                        aria-label={`Export ${p.title} as text`}
                      >
                        <FileType2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setPendingDelete(p)}
                        aria-label={`Delete ${p.title}`}
                      >
                        <Trash2 className="h-4 w-4 text-danger" />
                      </Button>
                    </div>
                  </div>
                  {open && (
                    <div
                      id={`proposal-${p.id}`}
                      className="border-t border-border bg-surface-soft px-4 py-5 text-[15px] leading-[1.7] text-foreground whitespace-pre-wrap sm:px-6 sm:py-6"
                    >
                      {p.content}
                      <div className="mt-5">
                        <Button asChild size="sm" variant="outline">
                          <Link to="/proposal/$id" params={{ id: p.id }}>
                            Open full view
                          </Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {pendingDelete && (
        <ConfirmDialog
          title="Delete this proposal?"
          description="This can't be undone."
          confirmLabel={remove.isPending ? "Deleting…" : "Delete"}
          onCancel={() => setPendingDelete(null)}
          onConfirm={() => remove.mutate(pendingDelete.id)}
          busy={remove.isPending}
        />
      )}
    </div>
  );
}

function FilterGroup({
  label,
  value,
  onChange,
  options,
  format,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  format?: (v: string) => string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</div>
      <div className="flex gap-1.5" role="group" aria-label={label}>
        {options.map((o) => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            aria-pressed={value === o}
            className={`whitespace-nowrap rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
              value === o
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-surface text-muted-foreground hover:text-foreground"
            }`}
          >
            {format ? format(o) : o}
          </button>
        ))}
      </div>
    </div>
  );
}

function ConfirmDialog({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
  busy,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  busy: boolean;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [busy, onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-foreground/25 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-lg">
        <h2 id="confirm-title" className="text-base font-semibold tracking-tight">
          {title}
        </h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={busy}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
