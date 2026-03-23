"use client";

import { useCallback, useEffect, useState } from "react";
import {
  fetchBootstrapOnce,
  type BootstrapStatus,
  BootstrapNetworkError,
} from "@/lib/bootstrapClient";
import { registerBootstrapRetry } from "@/lib/sessionRecovery";

export type { BootstrapStatus };

export type UseBootstrapResult = {
  status: BootstrapStatus;
  error: string | null;
  isAuthenticated: boolean;
  retry: () => void;
};

export function useBootstrap(): UseBootstrapResult {
  const [bootKey, setBootKey] = useState(0);
  const [status, setStatus] = useState<BootstrapStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  const retry = useCallback(() => {
    setStatus("loading");
    setError(null);
    setBootKey((k) => k + 1);
  }, []);

  useEffect(() => {
    registerBootstrapRetry(retry);
    return () => registerBootstrapRetry(null);
  }, [retry]);

  useEffect(() => {
    let cancelled = false;

    fetchBootstrapOnce()
      .then((next) => {
        if (cancelled) return;
        setStatus(next);
        setError(null);
      })
      .catch((e: unknown) => {
        if (cancelled) return;
        setStatus("error");
        if (e instanceof BootstrapNetworkError) {
          setError(
            "Network error — check your internet connection and try again.",
          );
        } else {
          setError(e instanceof Error ? e.message : String(e));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [bootKey]);

  return {
    status,
    error,
    isAuthenticated: status === "ready",
    retry,
  };
}
