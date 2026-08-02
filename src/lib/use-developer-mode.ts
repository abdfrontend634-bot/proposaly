import { useCallback, useEffect, useState } from "react";

const KEY = "proposly:developer-mode";
const EVENT = "proposly:developer-mode-change";

function read(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/**
 * Hidden developer mode. Enabled locally (per browser) and never affects
 * other users or any server-side behaviour.
 */
export function useDeveloperMode() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    setEnabled(read());
    const sync = () => setEnabled(read());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const set = useCallback((next: boolean) => {
    try {
      if (next) window.localStorage.setItem(KEY, "1");
      else window.localStorage.removeItem(KEY);
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { enabled, set, toggle: () => set(!read()) };
}
