import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  listPortfolio,
  savePortfolioItem,
  deletePortfolioItem,
} from "@/lib/portfolio.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Briefcase,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Link as LinkIcon,
  Github,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/portfolio")({
  head: () => ({
    meta: [
      { title: "Portfolio Vault — Proposly AI" },
      {
        name: "description",
        content:
          "Save the projects you've actually delivered so proposals can reference real work instead of invented experience.",
      },
      { property: "og:title", content: "Portfolio Vault — Proposly AI" },
      {
        property: "og:description",
        content:
          "Store your real projects once. Proposly matches them to each job posting when writing proposals.",
      },
    ],
  }),
  component: PortfolioPage,
});

type Item = {
  id: string;
  name: string;
  description: string;
  role: string;
  technologies: string[];
  services: string[];
  url: string | null;
  github_url: string | null;
  results: string;
  notes: string;
};

const emptyDraft = {
  id: undefined as string | undefined,
  name: "",
  description: "",
  role: "",
  technologies: "",
  services: "",
  url: "",
  github_url: "",
  results: "",
  notes: "",
};

type Draft = typeof emptyDraft;

function toDraft(item: Item): Draft {
  return {
    id: item.id,
    name: item.name ?? "",
    description: item.description ?? "",
    role: item.role ?? "",
    technologies: (item.technologies ?? []).join(", "),
    services: (item.services ?? []).join(", "),
    url: item.url ?? "",
    github_url: item.github_url ?? "",
    results: item.results ?? "",
    notes: item.notes ?? "",
  };
}

function splitList(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 30);
}

function PortfolioPage() {
  const qc = useQueryClient();
  const listFn = useServerFn(listPortfolio);
  const saveFn = useServerFn(savePortfolioItem);
  const deleteFn = useServerFn(deletePortfolioItem);

  const [draft, setDraft] = useState<Draft | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Item | null>(null);

  const items = useQuery({
    queryKey: ["portfolio"],
    queryFn: () => listFn() as Promise<Item[]>,
    staleTime: 30_000,
  });

  const save = useMutation({
    mutationFn: (d: Draft) =>
      saveFn({
        data: {
          ...(d.id ? { id: d.id } : {}),
          name: d.name.trim(),
          description: d.description.trim(),
          role: d.role.trim(),
          technologies: splitList(d.technologies),
          services: splitList(d.services),
          url: d.url.trim() || null,
          github_url: d.github_url.trim() || null,
          results: d.results.trim(),
          notes: d.notes.trim(),
        },
      }),
    onSuccess: (_r, d) => {
      toast.success(d.id ? "Project updated" : "Project added");
      setDraft(null);
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (e: Error) =>
      toast.error(
        e.message.includes("url")
          ? "Links must be full URLs, starting with https://"
          : e.message || "Couldn't save that project.",
      ),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Project deleted");
      setPendingDelete(null);
      qc.invalidateQueries({ queryKey: ["portfolio"] });
    },
    onError: (e: Error) => toast.error(e.message || "Couldn't delete that project."),
  });

  const list = items.data ?? [];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-widest text-primary">
            Portfolio Vault
          </div>
          <h1 className="mt-2 text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
            Your real work, ready to cite
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Proposly only mentions projects you've saved here. Add the details you'd be happy for a
            client to read — nothing gets invented.
          </p>
        </div>
        <Button onClick={() => setDraft({ ...emptyDraft })}>
          <Plus className="mr-2 h-4 w-4" /> Add project
        </Button>
      </header>

      {items.isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : items.isError ? (
        <div className="rounded-2xl border border-border bg-surface p-8 text-center">
          <p className="text-sm text-muted-foreground">
            We couldn't load your portfolio just now.
          </p>
          <Button className="mt-4" variant="outline" onClick={() => items.refetch()}>
            Try again
          </Button>
        </div>
      ) : list.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <div className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-primary/8 text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-lg font-semibold tracking-tight">No projects saved yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            Add two or three projects you're proud of. Proposals will then reference the ones that
            actually fit each job posting.
          </p>
          <Button className="mt-5" onClick={() => setDraft({ ...emptyDraft })}>
            <Plus className="mr-2 h-4 w-4" /> Add your first project
          </Button>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {list.map((item) => (
            <li
              key={item.id}
              className="flex flex-col rounded-2xl border border-border bg-surface p-5 shadow-xs"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate text-[15px] font-semibold tracking-tight">{item.name}</h3>
                  {item.role && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{item.role}</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Edit ${item.name}`}
                    onClick={() => setDraft(toDraft(item))}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${item.name}`}
                    onClick={() => setPendingDelete(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {item.description && (
                <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
                  {item.description}
                </p>
              )}

              {item.results && (
                <p className="mt-3 flex items-start gap-2 rounded-lg bg-surface-soft px-3 py-2 text-xs leading-relaxed text-foreground">
                  <TrendingUp className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  <span className="min-w-0">{item.results}</span>
                </p>
              )}

              {(item.technologies?.length || item.services?.length) && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {[...(item.technologies ?? []), ...(item.services ?? [])]
                    .slice(0, 8)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              )}

              {(item.url || item.github_url) && (
                <div className="mt-4 flex flex-wrap gap-3 border-t border-border pt-3 text-xs">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <LinkIcon className="h-3.5 w-3.5" /> Live link
                    </a>
                  )}
                  {item.github_url && (
                    <a
                      href={item.github_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                    >
                      <Github className="h-3.5 w-3.5" /> Code
                    </a>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Edit project" : "Add project"}</DialogTitle>
            <DialogDescription>
              Only facts you enter here can appear in your proposals.
            </DialogDescription>
          </DialogHeader>

          {draft && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                if (draft.name.trim().length < 2)
                  return toast.error("Give the project a name.");
                save.mutate(draft);
              }}
            >
              <Field label="Project name" htmlFor="pf-name">
                <Input
                  id="pf-name"
                  value={draft.name}
                  maxLength={120}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  placeholder="Shopify store migration"
                  required
                />
              </Field>

              <Field label="Your role" htmlFor="pf-role">
                <Input
                  id="pf-role"
                  value={draft.role}
                  maxLength={120}
                  onChange={(e) => setDraft({ ...draft, role: e.target.value })}
                  placeholder="Lead frontend developer"
                />
              </Field>

              <Field label="What you built" htmlFor="pf-desc">
                <Textarea
                  id="pf-desc"
                  value={draft.description}
                  maxLength={2000}
                  rows={4}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  placeholder="Rebuilt a 4,000-product catalogue on Shopify with a custom checkout flow."
                />
              </Field>

              <Field label="Outcome" htmlFor="pf-results" hint="Concrete results only.">
                <Textarea
                  id="pf-results"
                  value={draft.results}
                  maxLength={1000}
                  rows={2}
                  onChange={(e) => setDraft({ ...draft, results: e.target.value })}
                  placeholder="Cut page load from 4.2s to 1.1s; checkout completion up 18%."
                />
              </Field>

              <Field
                label="Technologies"
                htmlFor="pf-tech"
                hint="Comma separated."
              >
                <Input
                  id="pf-tech"
                  value={draft.technologies}
                  onChange={(e) => setDraft({ ...draft, technologies: e.target.value })}
                  placeholder="React, TypeScript, Shopify"
                />
              </Field>

              <Field label="Services" htmlFor="pf-services" hint="Comma separated.">
                <Input
                  id="pf-services"
                  value={draft.services}
                  onChange={(e) => setDraft({ ...draft, services: e.target.value })}
                  placeholder="Frontend development, Performance audit"
                />
              </Field>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Live URL" htmlFor="pf-url">
                  <Input
                    id="pf-url"
                    type="url"
                    value={draft.url}
                    onChange={(e) => setDraft({ ...draft, url: e.target.value })}
                    placeholder="https://example.com"
                  />
                </Field>
                <Field label="Repository" htmlFor="pf-gh">
                  <Input
                    id="pf-gh"
                    type="url"
                    value={draft.github_url}
                    onChange={(e) => setDraft({ ...draft, github_url: e.target.value })}
                    placeholder="https://github.com/…"
                  />
                </Field>
              </div>

              <Field
                label="Private notes"
                htmlFor="pf-notes"
                hint="For your reference. Used as context, never quoted verbatim."
              >
                <Textarea
                  id="pf-notes"
                  value={draft.notes}
                  maxLength={1000}
                  rows={2}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </Field>

              <DialogFooter className="gap-2">
                <Button type="button" variant="ghost" onClick={() => setDraft(null)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {draft.id ? "Save changes" : "Add project"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!pendingDelete}
        onOpenChange={(open) => !open && setPendingDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this project?</AlertDialogTitle>
            <AlertDialogDescription>
              “{pendingDelete?.name}” will be removed from your vault and won't be referenced in
              future proposals.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                if (pendingDelete) remove.mutate(pendingDelete.id);
              }}
            >
              {remove.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
