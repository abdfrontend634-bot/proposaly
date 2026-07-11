import { createFileRoute, Outlet, Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { AuthProvider, useAuth } from "@/lib/auth-context";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, LayoutDashboard, History, Settings as SettingsIcon, LogOut, Loader2 } from "lucide-react";
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

  useEffect(() => {
    if (!loading && !session) navigate({ to: "/auth", replace: true });
  }, [loading, session, navigate]);

  if (loading || !session) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function TopBar() {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  async function signOut() {
    await supabase.auth.signOut();
    toast.success("Signed out");
    navigate({ to: "/auth", replace: true });
  }

  const links = [
    { to: "/dashboard", label: "Generate", icon: LayoutDashboard },
    { to: "/history", label: "History", icon: History },
    { to: "/settings", label: "Settings", icon: SettingsIcon },
  ] as const;

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="grid h-7 w-7 place-items-center rounded-md bg-brand/15 text-brand ring-1 ring-inset ring-brand/30">
            <Sparkles className="h-3.5 w-3.5" />
          </div>
          <span className="text-sm font-bold tracking-tight">Gigify</span>
        </Link>

        <nav className="flex items-center gap-1">
          {links.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                  active ? "bg-surface text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-surface/60"
                }`}
              >
                <l.icon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{l.label}</span>
              </Link>
            );
          })}
          <Button variant="ghost" size="sm" onClick={signOut} className="ml-1 text-muted-foreground">
            <LogOut className="h-3.5 w-3.5" />
            <span className="ml-1 hidden sm:inline">Sign out</span>
          </Button>
        </nav>
      </div>
    </header>
  );
}
