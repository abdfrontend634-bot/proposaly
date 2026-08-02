/**
 * Single, guarded entry point for service-worker registration.
 *
 * The service worker is only allowed to register in the real published app.
 * It never registers in dev, inside an iframe, or in any Lovable preview host,
 * and it unregisters stale registrations in those contexts (plus via `?sw=off`).
 */

const SW_URL = "/sw.js";

function isBlockedContext(): boolean {
  if (!import.meta.env.PROD) return true;
  if (typeof window === "undefined") return true;

  try {
    if (window.self !== window.top) return true;
  } catch {
    return true;
  }

  const host = window.location.hostname;
  if (host.startsWith("id-preview--") || host.startsWith("preview--")) return true;
  if (host === "lovableproject.com" || host.endsWith(".lovableproject.com")) return true;
  if (host === "lovableproject-dev.com" || host.endsWith(".lovableproject-dev.com")) return true;
  if (host === "beta.lovable.dev" || host.endsWith(".beta.lovable.dev")) return true;
  if (new URLSearchParams(window.location.search).has("sw")) {
    if (new URLSearchParams(window.location.search).get("sw") === "off") return true;
  }
  return false;
}

async function unregisterAppServiceWorkers() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  try {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.allSettled(
      registrations
        .filter((registration) => {
          const scriptURL =
            registration.active?.scriptURL ??
            registration.waiting?.scriptURL ??
            registration.installing?.scriptURL ??
            "";
          return scriptURL.endsWith(SW_URL);
        })
        .map((registration) => registration.unregister()),
    );
  } catch {
    // ignore
  }
}

export type UpdateHandlers = {
  /** Called when a new version has been downloaded and is waiting to activate. */
  onUpdateAvailable: (activate: () => Promise<void>) => void;
};

/**
 * Registers the service worker and wires up update detection.
 * Returns a cleanup function.
 */
export function registerServiceWorker({ onUpdateAvailable }: UpdateHandlers): () => void {
  if (isBlockedContext()) {
    void unregisterAppServiceWorkers();
    return () => {};
  }
  if (!("serviceWorker" in navigator)) return () => {};

  let disposed = false;
  let pollTimer: ReturnType<typeof setInterval> | undefined;
  let registration: ServiceWorkerRegistration | undefined;

  const activate = async () => {
    const waiting = registration?.waiting;
    if (!waiting) {
      window.location.reload();
      return;
    }
    // The new worker takes over, then `controllerchange` reloads the page once.
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  const notifyIfWaiting = () => {
    if (disposed) return;
    if (registration?.waiting && navigator.serviceWorker.controller) {
      onUpdateAvailable(activate);
    }
  };

  let reloading = false;
  const onControllerChange = () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  };
  navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

  void navigator.serviceWorker
    .register(SW_URL, { scope: "/" })
    .then((reg) => {
      if (disposed) return;
      registration = reg;
      notifyIfWaiting();

      reg.addEventListener("updatefound", () => {
        const installing = reg.installing;
        if (!installing) return;
        installing.addEventListener("statechange", () => {
          if (installing.state === "installed") notifyIfWaiting();
        });
      });

      // Check for a new release periodically and when the app regains focus.
      pollTimer = setInterval(() => void reg.update().catch(() => {}), 60 * 60 * 1000);
      const onVisible = () => {
        if (document.visibilityState === "visible") void reg.update().catch(() => {});
      };
      document.addEventListener("visibilitychange", onVisible);
      window.addEventListener("online", onVisible);
    })
    .catch(() => {});

  return () => {
    disposed = true;
    if (pollTimer) clearInterval(pollTimer);
    navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
  };
}
