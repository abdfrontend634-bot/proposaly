import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { getSubscription, getCustomerPortalUrl } from "@/lib/billing.functions";
import { getProfile, saveProfile, TONES, LENGTHS } from "@/lib/profile.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  LogOut,
  Mail,
  KeyRound,
  Shield,
  Crown,
  ExternalLink,
  Terminal,
  UserRound,
  Save,
} from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "@/lib/brand";
import { useDeveloperMode } from "@/lib/use-developer-mode";
import { useFounder } from "@/lib/use-founder";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({ meta: [{ title: "Settings — Proposly AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useAuth();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const { enabled: devMode, set: setDevMode } = useDeveloperMode();
  const { isFounder } = useFounder();
  const [taps, setTaps] = useState(0);

  const subFn = useServerFn(getSubscription);
  const portalFn = useServerFn(getCustomerPortalUrl);

  const subscription = useQuery({ queryKey: ["subscription"], queryFn: () => subFn() });
  const portal = useMutation({
    mutationFn: () => portalFn(),
    onSuccess: (r) => {
      window.location.href = r.url;
    },
    onError: (e: Error) => {
      toast.error(e.message);
    },
  });

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

  const qc = useQueryClient();
  const profileFn = useServerFn(getProfile);
  const saveProfileFn = useServerFn(saveProfile);
  const profileQuery = useQuery({ queryKey: ["profile"], queryFn: () => profileFn() });

  const [form, setForm] = useState({
    display_name: "",
    professional_title: "",
    bio: "",
    skills: "",
    services: "",
    technologies: "",
    experience: "",
    preferred_tone: "Professional",
    preferred_length: "Standard",
    signature: "",
    availability: "",
  });
  const [loadedProfile, setLoadedProfile] = useState(false);

  useEffect(() => {
    if (loadedProfile || profileQuery.data === undefined) return;
    const p = profileQuery.data;
    if (p) {
      setForm({
        display_name: p.display_name ?? "",
        professional_title: p.professional_title ?? "",
        bio: p.bio ?? "",
        skills: (p.skills ?? []).join(", "),
        services: (p.services ?? []).join(", "),
        technologies: (p.technologies ?? []).join(", "),
        experience: p.experience ?? "",
        preferred_tone: p.preferred_tone ?? "Professional",
        preferred_length: p.preferred_length ?? "Standard",
        signature: p.signature ?? "",
        availability: p.availability ?? "",
      });
    }
    setLoadedProfile(true);
  }, [profileQuery.data, loadedProfile]);

  const toList = (s: string) =>
    s
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
      .slice(0, 40);

  const saveProfileMutation = useMutation({
    mutationFn: () =>
      saveProfileFn({
        data: {
          display_name: form.display_name.trim(),
          professional_title: form.professional_title.trim(),
          bio: form.bio.trim(),
          skills: toList(form.skills),
          services: toList(form.services),
          technologies: toList(form.technologies),
          experience: form.experience.trim(),
          preferred_tone: form.preferred_tone as (typeof TONES)[number],
          preferred_length: form.preferred_length as (typeof LENGTHS)[number],
          signature: form.signature.trim(),
          availability: form.availability.trim(),
          onboarded: true,
        },
      }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["profile"] });
      toast.success("Profile saved");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const field = (k: keyof typeof form) => ({
    value: form[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value })),
  });


  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <div className="text-xs font-semibold uppercase tracking-widest text-primary">Account</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight leading-snug sm:text-3xl">
          Settings
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Manage your Proposly AI account.
        </p>
      </div>

      <Section icon={Mail} title="Account" description="Your account details.">
        <div className="rounded-lg border border-border bg-surface-soft px-4 py-3 text-sm font-medium text-foreground">
          {user?.email}
        </div>
      </Section>

      <Section
        icon={UserRound}
        title="Your profile"
        description="Used automatically when generating proposals, so they sound like you."
      >
        {profileQuery.isPending ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading profile">
            <div className="h-10 rounded-lg shimmer" />
            <div className="h-10 rounded-lg shimmer" />
            <div className="h-24 rounded-lg shimmer" />
          </div>
        ) : profileQuery.isError ? (
          <div className="rounded-lg border border-danger/30 bg-danger/5 p-4 text-sm">
            <p className="text-foreground">{(profileQuery.error as Error).message}</p>
            <Button
              className="mt-3"
              size="sm"
              variant="outline"
              onClick={() => profileQuery.refetch()}
            >
              Try again
            </Button>
          </div>
        ) : (
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              saveProfileMutation.mutate();
            }}
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display_name">Name</Label>
                <Input id="display_name" maxLength={80} {...field("display_name")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="professional_title">Professional title</Label>
                <Input
                  id="professional_title"
                  maxLength={120}
                  placeholder="e.g. Full-stack developer"
                  {...field("professional_title")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Short bio</Label>
              <textarea
                id="bio"
                rows={4}
                maxLength={1200}
                className="w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground outline-none transition-colors focus-visible:border-primary"
                {...field("bio")}
              />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="skills">Skills</Label>
                <Input id="skills" placeholder="Comma separated" {...field("skills")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="services">Services</Label>
                <Input id="services" placeholder="Comma separated" {...field("services")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="technologies">Technologies</Label>
                <Input id="technologies" placeholder="Comma separated" {...field("technologies")} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="experience">Experience</Label>
                <Input
                  id="experience"
                  maxLength={400}
                  placeholder="e.g. 5 years building web apps"
                  {...field("experience")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium">Preferred tone</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preferred tone">
                {TONES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    aria-pressed={form.preferred_tone === t}
                    onClick={() => setForm((f) => ({ ...f, preferred_tone: t }))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.preferred_tone === t
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="block text-sm font-medium">Preferred length</span>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Preferred length">
                {LENGTHS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    aria-pressed={form.preferred_length === l}
                    onClick={() => setForm((f) => ({ ...f, preferred_length: l }))}
                    className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
                      form.preferred_length === l
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-surface text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="availability">Availability</Label>
                <Input
                  id="availability"
                  maxLength={200}
                  placeholder="e.g. 20 hrs/week, start next Monday"
                  {...field("availability")}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="signature">Sign-off</Label>
                <Input
                  id="signature"
                  maxLength={300}
                  placeholder="e.g. Best, Alex"
                  {...field("signature")}
                />
              </div>
            </div>

            <Button type="submit" disabled={saveProfileMutation.isPending}>
              {saveProfileMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save profile
            </Button>
          </form>
        )}
      </Section>


      <Section
        icon={Crown}
        title="Subscription"
        description="Your plan and billing details."
      >
        <div className="rounded-lg border border-border bg-surface-soft px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold text-foreground">
                {subscription.data?.isPro ? "Pro" : "Free"}
              </div>
              <div className="text-xs text-muted-foreground">
                {subscription.data?.isPro
                  ? "Unlimited proposals, priority AI, and extended history."
                  : "50 proposals per month."}
              </div>
            </div>
            {subscription.data?.isPro ? (
              <Button
                variant="outline"
                size="sm"
                disabled={portal.isPending}
                onClick={() => portal.mutate()}
              >
                {portal.isPending && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
                <ExternalLink className="mr-2 h-3.5 w-3.5" /> Manage
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to="/upgrade">Upgrade</Link>
              </Button>
            )}
          </div>
        </div>
      </Section>

      <Section
        icon={KeyRound}
        title="Change password"
        description="Update the password used to sign in."
      >
        <form onSubmit={changePassword} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="pw" className="text-sm font-medium">
              New password
            </Label>
            <Input
              id="pw"
              type="password"
              minLength={6}
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>
          <Button type="submit" disabled={busy || !pw}>
            {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Update password
          </Button>
        </form>
      </Section>

      <Section icon={Shield} title="Session" description="Sign out on this device.">
        <Button variant="outline" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" /> Sign out
        </Button>
      </Section>

      {devMode && isFounder && (
        <Section
          icon={Terminal}
          title="Developer mode"
          description="Local diagnostics for this browser only."
        >
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link to="/developer">Open developer panel</Link>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setDevMode(false);
                toast.success("Developer mode disabled");
              }}
            >
              Turn off
            </Button>
          </div>
        </Section>
      )}

      <div className="pb-2 text-center">
        <button
          type="button"
          onClick={() => {
            if (!isFounder) return;
            const next = taps + 1;
            setTaps(next);
            if (next >= 5 && !devMode) {
              setDevMode(true);
              toast.success("Developer mode enabled");
            }
          }}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          aria-label={`${BRAND.name} version ${BRAND.version}`}
        >
          {BRAND.name} v{BRAND.version}
        </button>
      </div>
    </div>
  );
}

function Section({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-7 shadow-xs">
      <div className="mb-6 flex items-start gap-3">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/8 text-primary">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
