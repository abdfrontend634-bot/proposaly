import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { getSubscription } from "@/lib/billing.functions";
import {
  Terminal,
  LayoutDashboard,
  History,
  MessageSquare,
  Settings as SettingsIcon,
  LogOut,
  Loader2,
  Menu,
  X,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LogoMark } from "@/components/brand";
import { BRAND } from "@/lib/brand";
import { useDeveloperMode } from "@/lib/use-developer-mode";
import { useFounder } from "@/lib/use-founder";
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChat = pathname === "/chat";
  const { isFounder, loading: founderLoading } = useFounder();
  const { enabled: devMode, set: setDevMode } = useDeveloperMode();

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  // Founder accounts get developer mode automatically after login.
  useEffect(() => {
    if (founderLoading) return;
    if (isFounder && !devMode) setDevMode(true);
    if (!isFounder && devMode) setDevMode(false);
  }, [isFounder, founderLoading, devMode, setDevMode]);

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
          <span className="text-sm font-semibold">{BRAND.name}</span>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)} aria-label="Open menu" aria-expanded={mobileOpen}>
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="flex">
        <Sidebar />
        {mobileOpen && <MobileSidebar onClose={() => setMobileOpen(false)} />}

        <main
          className={
            isChat
              ? "h-[calc(100dvh-3.5rem)] min-w-0 flex-1 lg:h-dvh"
              : "min-h-[calc(100vh-3.5rem)] flex-1 lg:min-h-screen"
          }
        >
          {isChat ? (
            <Outlet />
          ) : (
            <div className="mx-auto max-w-5xl px-6 pb-10 pt-8 lg:px-10 lg:pb-14 lg:pt-10">
              <Outlet />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}


function Logo() {
  return <LogoMark />;
}

const NAV = [
  { to: "/dashboard", label: "Generate", icon: LayoutDashboard },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/history", label: "History", icon: History },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
] as const;

const FOUNDER_NAV = [{ to: "/chat", label: "AI Assistant", icon: MessageSquare }] as const;

function useNavItems() {
  const { isFounder } = useFounder();
  return isFounder ? [NAV[0], ...FOUNDER_NAV, ...NAV.slice(1)] : [...NAV];
}

function Sidebar() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);
  const { enabled: devMode } = useDeveloperMode();
  const { isFounder } = useFounder();
  const navItems = useNavItems();

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
        <span className="text-[15px] font-semibold tracking-tight">{BRAND.name}</span>
      </div>

      <nav className="flex-1 space-y-0.5 px-3 py-4" aria-label="Primary">
        <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          Workspace
        </div>
        {navItems.map((l) => {
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
        {devMode && isFounder && (
          <Link
            to="/developer"
            aria-current={pathname === "/developer" ? "page" : undefined}
            className={`mt-1 flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
              pathname === "/developer"
                ? "bg-primary/8 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <Terminal className="h-4 w-4" />
            Developer
          </Link>
        )}
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
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
            aria-label="Sign out"
          >
            {signingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </aside>
  );
}

function MobileSidebar({ onClose }: { onClose: () => void }) {
  const navItems = useNavItems();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  async function signOut() {
    try {
      await supabase.auth.signOut();
    } finally {
      onClose();
      navigate({ to: "/auth", replace: true });
    }
  }
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} aria-hidden="true" />
      <div className="absolute right-0 top-0 h-full w-72 bg-surface shadow-lg">
        <div className="flex h-14 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-sm font-semibold">{BRAND.name}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close menu">
            <X className="h-5 w-5" />
          </Button>
        </div>
        <nav className="space-y-0.5 p-3" aria-label="Primary">
          {navItems.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
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
            aria-current={pathname === "/upgrade" ? "page" : undefined}
            className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
              pathname === "/upgrade" ? "bg-primary/8 text-primary" : "text-muted-foreground hover:bg-muted"
            }`}
          >
            <Crown className="h-4 w-4" /> Upgrade
          </Link>
          <button
            type="button"
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
