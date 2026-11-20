import { useCallback, useEffect, useState } from "react";
import { api, errorMessage } from "./api";

export function useGet<T>(path: string, params?: Record<string, unknown>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(params ?? {});

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get<T>(path, { params: JSON.parse(key) });
      setData(res.data);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [path, key]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, error, loading, reload: load };
}
