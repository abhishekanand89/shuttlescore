import { useState, useEffect, useCallback } from "react";

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

/**
 * Generic hook for API calls with loading/error state management.
 * Automatically fetches on mount if `immediate` is true (default).
 */
export function useApi<T>(
  fetcher: () => Promise<T>,
  deps: unknown[] = [],
  immediate = true
) {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: immediate,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const data = await fetcher();
      setState({ data, loading: false, error: null });
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setState({ data: null, loading: false, error: message });
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) {
      execute();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [execute]);

  return { ...state, refetch: execute };
}
