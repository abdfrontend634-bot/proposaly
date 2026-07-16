import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getSubscription } from "@/lib/billing.functions";
import {
  Sparkles,
  LayoutDashboard,
  History,
  Settings as SettingsIcon,
  LogOut,
  Loader2,
  Menu,
  X,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_app")({
  component: () => (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  ),
});

function AppShell() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-4 lg:hidden">
        <Link to="/dashboard" className="flex items-center gap-2">
          <Logo />
          <span className="text-sm font-semibold">Gigify</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex">
        <Sidebar />
        {mobileOpen && <MobileSidebar onClose={() => setMobileOpen(false)} />}

        <main className="min-h-[calc(100vh-3.5rem)] flex-1 lg:min-h-screen">
          <div className="mx-auto max-w-5xl px-6 pb-10 pt-8 lg:px-10 lg:pb-14 lg:pt-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
      <Sparkles className="h-4 w-4" />
    </div>
  );
}

const NAV = [
  { to: "/dashboard", label: "Generate", icon: LayoutDashboard },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

function Sidebar() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  const subFn = useServerFn(getSubscription);
  const subscription = useQuery({
    queryKey: ["subscription"],
    queryFn: () => subFn(),
    staleTime: 60_000,
  });
  const planLabel = subscription.data?.isPro ? "Pro plan" : "Free plan";

  async function signOut() {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await supabase.auth.signOut();
      toast.success("Signed out");
      navigate({ to: "/auth", replace: true });
    } catch {
      toast.error("Couldn't sign out. Try again.");
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-border bg-surface lg:flex">
      <div className="flex h-16 items-center gap-2.5 px-6">
        <Logo />
        <span className="text-[15px] font-semibold tracking-tight">Gigify</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4" aria-label="Primary">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Workspace
        </div>
        {NAV.map((l) => {
          const active = pathname === l.to;
          return (
            <Link
              key={l.to}
              to={l.to}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                active
                  ? "bg-primary/8 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <l.icon className="h-4 w-4" strokeWidth={active ? 2.5 : 2} />
              {l.label}
            </Link>
          );
        })}
        <Link
          to="/upgrade"
          aria-current={pathname === "/upgrade" ? "page" : undefined}
          className={`mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
            pathname === "/upgrade"
              ? "bg-primary/8 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}
        >
          <Crown className="h-4 w-4" />
          Upgrade
        </Link>
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold uppercase text-foreground">
            {user?.email?.[0]}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs font-medium text-foreground">{user?.email}</div>
            <div className="text-[11px] text-muted-foreground">{planLabel}</div>
          </div>
          <button
            onClick={signOut}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileSidebar({ onClose }: { onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  async function signOut() {
    await supabase.auth.signOut();
    onClose();
    navigate({ to: "/auth", replace: true });
  }
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-72 bg-surface shadow-lg">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-sm font-semibold">Gigify</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="space-y-0.5 p-3">
          {NAV.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={onClose}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                  active ? "bg-primary/8 text-primary" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <l.icon className="h-4 w-4" /> {l.label}
              </Link>
            );
          })}
          <Link
            to="/upgrade"
            onClick={onClose}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
              pathname === "/upgrade" ? "bg-primary/8 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Crown className="h-4 w-4" /> Upgrade
          </Link>
          <button
            onClick={signOut}
            className="mt-4 flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"
          >
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </nav>
      </div>
    </div>
  );
}
