"use client";

import { useEffect } from "react";
import { checkStatus } from "@/lib/apiStatus";

export function StatusSync(props: { enabled?: boolean }) {
  const enabled = props.enabled !== false;

  useEffect(() => {
    if (!enabled) return;

    void checkStatus();
    const id = window.setInterval(() => void checkStatus(), 60_000);
    return () => window.clearInterval(id);
  }, [enabled]);

  return null;
}
