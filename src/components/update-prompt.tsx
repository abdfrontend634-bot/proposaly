import { useCallback, useEffect, useRef, useState } from "react";
import { Download, RefreshCw, X } from "lucide-react";

import { registerServiceWorker } from "@/lib/register-sw";

/**
 * Twitter/Instagram-style in-app update prompt.
 * Appears when a new release has been downloaded in the background; one tap
 * activates it and reloads. Login and local data are untouched.
 */
export function UpdatePrompt() {
  const [visible, setVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const activateRef = useRef<(() => Promise<void>) | null>(null);

  useEffect(() => {
    const cleanup = registerServiceWorker({
      onUpdateAvailable: (activate) => {
        activateRef.current = activate;
        setVisible(true);
      },
    });
    return cleanup;
  }, []);

  const update = useCallback(async () => {
    setUpdating(true);
    try {
      await activateRef.current?.();
    } catch {
      window.location.reload();
    }
  }, []);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:bottom-6 sm:justify-end sm:pr-6"
    >
      <div className="animate-in fade-in slide-in-from-bottom-4 pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-elevated duration-300 sm:p-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Download className="size-5" aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold leading-snug text-foreground">
            A new version of Proposly AI is available.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Update now — you&apos;ll stay signed in.
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            type="button"
            onClick={update}
            disabled={updating}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-px hover:bg-primary/90 active:scale-[0.98] disabled:opacity-70"
          >
            {updating ? (
              <RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />
            ) : null}
            {updating ? "Updating" : "Update Now"}
          </button>
          <button
            type="button"
            onClick={() => setVisible(false)}
            aria-label="Dismiss update notification"
            className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
