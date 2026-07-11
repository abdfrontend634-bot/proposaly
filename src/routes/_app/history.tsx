import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Copy, Search, Loader2, FileText } from "lucide-react";
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

  useEffect(() => { load(); }, []);

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
    if (error) { setItems(prev); toast.error(error.message); }
    else toast.success("Deleted");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">History</h1>
        <p className="mt-1 text-sm text-muted-foreground">Your saved proposals.</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search proposals…"
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-16 text-muted-foreground justify-center">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : filtered.length === 0 ? (
        <div className="grid place-items-center rounded-2xl border border-dashed border-border bg-surface/30 py-20 text-center">
          <FileText className="mb-2 h-6 w-6 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            {items.length === 0 ? "No proposals saved yet." : "No matches for your search."}
          </div>
        </div>
      ) : (
        <ul className="grid gap-3">
          {filtered.map((p) => {
            const open = openId === p.id;
            return (
              <li key={p.id} className="rounded-2xl border border-border bg-surface/40 transition-colors hover:bg-surface/70">
                <button
                  onClick={() => setOpenId(open ? null : p.id)}
                  className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-4 text-left"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{p.title}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="rounded bg-brand/10 px-1.5 py-0.5 text-brand">{p.platform}</span>
                      <span>·</span>
                      <span>{p.tone}</span>
                      <span>·</span>
                      <span>{new Date(p.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(p.content); toast.success("Copied"); }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); del(p.id); }}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </button>
                {open && (
                  <div className="border-t border-border/60 p-4 text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                    {p.content}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
