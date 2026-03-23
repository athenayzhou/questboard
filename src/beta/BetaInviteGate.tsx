"use client";

import { useState, useEffect, useRef } from "react";
import { showToast } from "@/utils/toast";

const SESSION_ERRORS: Record<string, string> = {
  inviteKey_required: "enter invite code.",
  invalid_invite: "invite code is not valid",
  invite_revoked: "invite has been revoked",
  invite_expired: "invite has expired",
  invite_max_uses_reached: "invite has reached its use limit",
  server_error: "server error... try again later..",
};

type Props = {
  onSignedIn: () => void;
};

export function BetaInviteGate({ onSignedIn }: Props) {
  const [inviteKey, setInviteKey] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = inviteKey.trim();
    if (!trimmed) {
      showToast("warning", SESSION_ERRORS.inviteKey_required);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/beta/session", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteKey: trimmed }),
      });

      const json = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };

      if (!res.ok || !json.ok) {
        const msg =
          SESSION_ERRORS[json.error ?? ""] ??
          `Could not sign in (${res.status}).`;
        showToast("error", msg);
        return;
      }

      showToast("success", "signed in... loading data..");
      onSignedIn();
    } catch {
      showToast("error", "network error... check connection..");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bootstrap-gate" role="main" aria-labelledby="gate-title">
      <div
        className="bootstrap-gate-card"
        aria-busy={submitting}
        aria-live="polite"
      >
        <h1 id="gate-title" className="bootstrap-gate-title">
          Questboard
        </h1>
        <p className="bootstrap-gate-lead">
          enter your beta invite code to load your saved quests and skills
        </p>
        <form onSubmit={handleSubmit} className="bootstrap-gate-form">
          <label className="bootstrap-gate-label" htmlFor="invite-key">
            Invite code
          </label>
          <input
            ref={inputRef}
            id="invite-key"
            type="password"
            autoComplete="one-time-code"
            className="bootstrap-gate-input"
            value={inviteKey}
            onChange={(e) => setInviteKey(e.target.value)}
            placeholder="paste your code"
            disabled={submitting}
          />
          <button
            type="submit"
            className="bootstrap-gate-submit"
            disabled={submitting}
          >
            {submitting ? "Signing in…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}
