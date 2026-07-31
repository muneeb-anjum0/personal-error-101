import { useCallback, useEffect, useState } from "react";
import { toFriendlyError } from "../services/api-client/api-error";

export function useApiResource<T>(
  load: (signal: AbortSignal) => Promise<T>,
  dependencies: unknown[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastSuccessAt, setLastSuccessAt] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const controller = new AbortController();
    setLoading(true);
    try {
      const next = await load(controller.signal);
      setData(next);
      setError(null);
      setLastSuccessAt(new Date().toISOString());
    } catch (loadError) {
      setError(toFriendlyError(loadError));
    } finally {
      setLoading(false);
    }
    return () => controller.abort();
  }, dependencies);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    load(controller.signal)
      .then((next) => {
        setData(next);
        setError(null);
        setLastSuccessAt(new Date().toISOString());
      })
      .catch((loadError: unknown) => setError(toFriendlyError(loadError)))
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, dependencies);

  return { data, error, loading, lastSuccessAt, refresh };
}
