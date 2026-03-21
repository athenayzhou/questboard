"use client";

import { useEffect } from "react";
import { checkStatus } from "@/lib/apiStatus";

/**
 * Renders nothing. While mounted, periodically POSTs `/api/me/status` so
 * `testers.last_seen_at` stays current — the friends list uses that (with session)
 * to show online / idle vs offline. The visible indicator is the colored dot on
 * each friend card, not this component.
 */
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
