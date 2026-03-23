"use client";

import { useState, useEffect, useRef } from "react";
import { useUserStore } from "@/store/user";
import { isReservedDisplayName } from "@/lib/defaultUserData";
import { showToast } from "@/utils/toast";

const MAX_LEN = 48;

export function WelcomeGate() {
  const user = useUserStore((s) => s.user);
  const setUser = useUserStore((s) => s.setUser);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next = draft.trim();
    if (!next) {
      showToast("warning", "enter a name to continue.");
      return;
    }
    if (isReservedDisplayName(next)) {
      showToast(
        "warning",
        "choose a different name than the default placeholder.",
      );
      return;
    }
    setUser({
      ...user,
      profile: { ...user.profile, name: next.slice(0, MAX_LEN) },
    });
  }

  return (
    <div
      className="bootstrap-gate"
      role="main"
      aria-labelledby="welcome-name-title"
    >
      <div className="bootstrap-gate-card">
        <h1 id="welcome-name-title" className="bootstrap-gate-title">
          Welcome!
        </h1>
        <p className="bootstrap-gate-lead">
          enter name. this is how you will appear on your profile and to friends
        </p>
        <form onSubmit={handleSubmit} className="bootstrap-gate-form">
          <label className="bootstrap-gate-label" htmlFor="welcome-character-name">
            character name
          </label>
          <input
            ref={inputRef}
            id="welcome-character-name"
            type="text"
            name="character-name"
            className="bootstrap-gate-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
            placeholder="your name"
            autoComplete="nickname"
            autoCapitalize="words"
            spellCheck={false}
            maxLength={MAX_LEN}
            enterKeyHint="done"
          />
          <button type="submit" className="bootstrap-gate-submit">
            continue
          </button>
        </form>
        <aside className="bootstrap-gate-disclaimer" aria-label="Beta disclaimer">
          <p className="bootstrap-gate-disclaimer-label">beta notice</p>
          <p className="bootstrap-gate-disclaimer-text">
            data may be reset during beta testing. some features may be unavailable at times.
          </p>
        </aside>
      </div>
    </div>
  );
}
