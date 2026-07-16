import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Copy, Search, FileText, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Proposal = {
  id: string;
  title: string;
  platform: string;
  tone: string;
  content: string;
  created_at: string;
};

export const Route = createFileRoute("/_app/history")({
  head: () => ({ meta: [{ title: "History — Gigify" }] }),
  component: HistoryPage,
});

async function fetchProposals(): Promise<Proposal[]> {
  const { data, error } = await supabase
    .from("proposals")
    .select("id,title,platform,tone,content,created_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

function HistoryPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Proposal | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const query = useQuery({
    queryKey: ["proposals"],
    queryFn: fetchProposals,
    staleTime: 30_000,
  });

  useEffect(() => {
    if (query.error) toast.error((query.error as Error).message);
  }, [query.error]);

  const items = query.data ?? [];

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (i) => i.title.toLowerCase().includes(s) || i.content.toLowerCase().includes(s),
    );
  }, [items, q]);

  async function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setDeletingId(id);
    const prev = items;
    qc.setQueryData<Proposal[]>(["proposals"], (curr) => (curr ?? []).filter((i) => i.id !== id));
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    setDeletingId(null);
    setPendingDelete(null);
    if (error) {
      qc.setQueryData<Proposal[]>(["proposals"], prev);
      toast.error("Couldn't delete. Please try again.");
    } else {
      toast.success("Deleted");
    }
  }

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
            Everything you've saved, in one place.
          </p>
        </div>
        <div className="text-sm leading-relaxed text-muted-foreground" aria-live="polite">
          {query.isPending ? "Loading…" : `${items.length} ${items.length === 1 ? "proposal" : "proposals"}`}
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or content…"
          className="h-12 pl-11"
          aria-label="Search proposals"
        />
      </div>

      {query.isPending ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs" aria-busy="true" aria-label="Loading proposals">
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
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface py-24 text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-muted">
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 text-sm font-medium text-foreground">
            {items.length === 0 ? "No proposals saved yet" : "No matches"}
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length === 0
              ? "Generate one from the dashboard to get started."
              : "Try a different search."}
          </p>
          {items.length === 0 && (
            <div className="mt-6">
              <Button asChild size="sm">
                <Link to="/dashboard">Generate a proposal</Link>
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          <ul className="divide-y divide-border">
            {filtered.map((p) => {
              const open = openId === p.id;
              return (
                <li key={p.id}>
                  <div className="group flex items-center gap-3 px-4 py-4 transition-colors hover:bg-[#FAFAF7] sm:gap-4 sm:px-6 sm:py-5">
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
                        onClick={() => setPendingDelete(p)}
                        disabled={deletingId === p.id}
                        aria-label={`Delete ${p.title}`}
                      >
                        <Trash2 className="h-4 w-4 text-[#DC2626]" />
                      </Button>
                    </div>
                  </div>
                  {open && (
                    <div
                      id={`proposal-${p.id}`}
                      className="border-t border-border bg-[#FAFAF7] px-4 py-5 text-[15px] leading-[1.7] text-foreground whitespace-pre-wrap sm:px-6 sm:py-6"
                    >
                      {p.content}
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
          confirmLabel={deletingId ? "Deleting…" : "Delete"}
          onCancel={() => setPendingDelete(null)}
          onConfirm={confirmDelete}
          busy={!!deletingId}
        />
      )}
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
      className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-title"
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-surface p-6 shadow-lg">
        <h2 id="confirm-title" className="text-base font-semibold tracking-tight">{title}</h2>
        <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} disabled={busy}>Cancel</Button>
          <Button onClick={onConfirm} disabled={busy}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}
