import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getFounderStatus } from "@/lib/founder.functions";

/** Founder recognition. Server-decided; no founder identity lives in client code. */
export function useFounder() {
  const fn = useServerFn(getFounderStatus);
  const q = useQuery({
    queryKey: ["founder-status"],
    queryFn: () => fn(),
    staleTime: 5 * 60_000,
  });
  return {
    isFounder: q.data?.isFounder ?? false,
    displayName: q.data?.displayName ?? null,
    loading: q.isLoading,
  };
}
