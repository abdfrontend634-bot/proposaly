import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Copy, Search, Loader2, FileText, ChevronRight } from "lucide-react";
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

function HistoryPage() {
  const [items, setItems] = useState<Proposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("proposals")
      .select("id,title,platform,tone,content,created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setItems(data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(
      (i) => i.title.toLowerCase().includes(s) || i.content.toLowerCase().includes(s),
    );
  }, [items, q]);

  async function del(id: string) {
    const prev = items;
    setItems((x) => x.filter((i) => i.id !== id));
    const { error } = await supabase.from("proposals").delete().eq("id", id);
    if (error) {
      setItems(prev);
      toast.error(error.message);
    } else toast.success("Deleted");
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
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
        <div className="text-sm leading-relaxed text-muted-foreground">
          {items.length} {items.length === 1 ? "proposal" : "proposals"}
        </div>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or content…"
          className="h-12 pl-11"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
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
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xs">
          <ul className="divide-y divide-border">
            {filtered.map((p) => {
              const open = openId === p.id;
              return (
                <li key={p.id}>
                  <div className="group flex items-center gap-4 px-6 py-5 transition-colors hover:bg-[#FAFAF7]">
                    <button
                      onClick={() => setOpenId(open ? null : p.id)}
                      className="flex min-w-0 flex-1 items-center gap-4 text-left"
                    >
                      <ChevronRight
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`}
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
                          <span>·</span>
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
                        onClick={() => {
                          navigator.clipboard.writeText(p.content);
                          toast.success("Copied");
                        }}
                        aria-label="Copy"
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => del(p.id)}
                        aria-label="Delete"
                      >
                        <Trash2 className="h-4 w-4 text-[#DC2626]" />
                      </Button>
                    </div>
                  </div>
                  {open && (
                    <div className="border-t border-border bg-[#FAFAF7] px-6 py-6 text-[15px] leading-[1.7] text-foreground whitespace-pre-wrap">
                      {p.content}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
