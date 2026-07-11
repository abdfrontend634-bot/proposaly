import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Gigify" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 6) return toast.error("Password must be at least 6 characters.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    setPw("");
    toast.success("Password updated");
  }

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account.</p>
      </div>

      <div className="rounded-2xl border border-border bg-surface/40 p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Account</div>
        <div className="mt-2 text-sm">{user?.email}</div>
      </div>

      <form onSubmit={changePassword} className="rounded-2xl border border-border bg-surface/40 p-5 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Change password</div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw">New password</Label>
          <Input id="pw" type="password" minLength={6} value={pw}
            onChange={(e) => setPw(e.target.value)} placeholder="At least 6 characters" />
        </div>
        <Button type="submit" disabled={busy || !pw}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Update password
        </Button>
      </form>

      <div className="rounded-2xl border border-border bg-surface/40 p-5">
        <div className="text-xs uppercase tracking-wide text-muted-foreground">Session</div>
        <Button variant="secondary" onClick={signOut} className="mt-3">
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </div>
    </div>
  );
}
