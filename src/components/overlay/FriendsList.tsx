"use client";

import { useState, useEffect, useMemo } from "react";
import { useOverlay } from "../../store/overlay";
import { useFriendsStore } from "../../store/friends";
import { showToast } from "../../utils/toast";
import { normalizePlayerCodeInput } from "../../utils/format/code";
import { fetchFriendSummaries } from "@/lib/apiFriendsSummary";
import type { FriendActivity, FriendSummary } from "@/types/friend";
import { getDevFriendUiDetail } from "@/dev/friendsUiDemo";
import { IconUserPlus, IconX } from "../ui/icons";
import { PlayerNamePlate } from "../PlayerNamePlate";

type LookupOk = {
  playerCode: string;
  displayName: string;
};

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 30_000) return "now";
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function FriendActivityBlock({
  items,
  ariaLabel,
}: {
  items: FriendActivity[];
  ariaLabel: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className="friend-activity-wrap">
      <div className="friend-activity__cap">recent skill activity</div>
      <ul className="friend-activity" aria-label={ariaLabel}>
        {items.slice(0, 3).map((a) => (
          <li key={a.id} className="friend-activity__row">
            <span className="friend-activity__label">{a.name ?? "skill"}</span>
            <span className="friend-activity__meta">
              +{a.amount} · {timeAgo(a.timestamp)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function FriendsList() {
  const closeOverlay = useOverlay((s) => s.closeOverlay);
  const activeOverlay = useOverlay((s) => s.activeOverlay);
  const friends = useFriendsStore((s) => s.friends);
  const addFriend = useFriendsStore((s) => s.addFriend);

  const [showAdd, setShowAdd] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<LookupOk | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<Record<string, FriendSummary>>({});

  /** Refresh dev activity timestamps when opening the overlay. */
  const devUiTick = useMemo(() => Date.now(), [activeOverlay]);

  useEffect(() => {
    if (activeOverlay !== "friends" || friends.length === 0) {
      return;
    }
    const codes = friends.map((f) => f.id);
    let cancelled = false;
    void fetchFriendSummaries(codes).then((list) => {
      if (cancelled) return;
      const next: Record<string, FriendSummary> = {};
      for (const s of list) {
        next[s.playerCode] = s;
      }
      setSummaries(next);
    });
    return () => {
      cancelled = true;
    };
  }, [activeOverlay, friends]);

  function resetModal() {
    setCodeInput("");
    setPreview(null);
    setLookupError(null);
    setLoading(false);
  }

  function openModal() {
    resetModal();
    setShowAdd(true);
  }

  function closeModal() {
    setShowAdd(false);
    resetModal();
  }

  async function handleLookup() {
    const code = normalizePlayerCodeInput(codeInput);
    if (!code) {
      setLookupError("enter a valid player id (e.g. QB-XXXXXXXX)");
      setPreview(null);
      return;
    }
    setLoading(true);
    setLookupError(null);
    setPreview(null);
    try {
      const res = await fetch(
        `/api/me/friends/lookup?code=${encodeURIComponent(code)}`,
        { credentials: "include" },
      );
      const json = (await res.json()) as {
        ok?: boolean;
        error?: string;
        data?: LookupOk;
      };
      if (!res.ok || !json.ok || !json.data) {
        const err = json.error ?? "unknown";
        const messages: Record<string, string> = {
          unauthorized: "sign in required",
          invalid_code: "invalid player id format",
          not_found: "no player with that id",
          self: "that’s your own id",
        };
        setLookupError(messages[err] ?? "lookup failed");
        return;
      }
      setPreview(json.data);
    } catch {
      setLookupError("network error");
    } finally {
      setLoading(false);
    }
  }

  function handleAddFriend() {
    if (!preview) return;
    if (friends.some((f) => f.id === preview.playerCode)) {
      showToast("warning", "already in your list");
      return;
    }
    addFriend({
      id: preview.playerCode,
      name: preview.displayName,
      status: "offline",
    });
    showToast("success", "friend added");
    closeModal();
  }

  return (
    <div className="overlay friends-overlay">
      <div className="header friends-header">
        <h1>friends list</h1>
        <div className="header-actions">
          <button
            type="button"
            className="add-friend-btn"
            aria-label="Add friend"
            title="Add friend by player id"
            onClick={openModal}
          >
            <IconUserPlus size={16} />
          </button>
          <button
            type="button"
            className="close friend-btn"
            onClick={closeOverlay}
            aria-label="Close friends list"
            title="Close"
          >
            <IconX size={18} />
          </button>
        </div>
      </div>

      {showAdd ? (
        <div
          className="friends-add-modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="friends-add-title"
        >
          <div className="friends-add-card">
            <h2 id="friends-add-title" className="friends-add-title">
              add friend
            </h2>
            <p className="friends-add-hint">
              enter their player id (e.g. <code>QB-A1B2C3D4</code>)
            </p>
            <input
              type="text"
              className="friends-add-input"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleLookup();
              }}
              placeholder="QB-…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            <div className="friends-add-actions">
              <button
                type="button"
                className="friends-add-btn friends-add-btn--ghost"
                onClick={closeModal}
              >
                cancel
              </button>
              <button
                type="button"
                className="friends-add-btn friends-add-btn--primary"
                disabled={loading}
                onClick={() => void handleLookup()}
              >
                {loading ? "…" : "look up"}
              </button>
            </div>
            {lookupError ? (
              <p className="friends-add-error" role="alert">
                {lookupError}
              </p>
            ) : null}
            {preview ? (
              <div className="friends-add-preview">
                <div className="friends-add-preview-name">{preview.displayName}</div>
                <div className="friends-add-preview-code">{preview.playerCode}</div>
                <button
                  type="button"
                  className="friends-add-btn friends-add-btn--primary friends-add-btn--full"
                  onClick={handleAddFriend}
                >
                  add to list
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="friends-list">
        {friends.map((friend) => {
          const summary = summaries[friend.id];
          const status = summary?.status ?? friend.status;
          const displayName = summary?.displayName ?? friend.name;

          const devUi = getDevFriendUiDetail(friend.id, devUiTick);

          const shown = summary
            ? new Set(summary.badges.displayedBadgeIds)
            : null;
          const plateFromSummary =
            summary && shown
              ? summary.badges.badgePlacements.filter((p) => shown.has(p.id))
              : [];

          const platePlacements =
            devUi && devUi.badgePlacements.length > 0
              ? devUi.badgePlacements
              : plateFromSummary;

          const activityItems: FriendActivity[] =
            devUi && devUi.activity.length > 0
              ? devUi.activity
              : summary?.recentActivity?.slice(0, 3) ?? [];

          return (
            <div key={friend.id} className="friend-card">
              <div className="friend-card__ribbon" aria-hidden />
              <div className="friend-card__head">
                <div
                  className="friend-status friend-status--labeled"
                  role="status"
                  title={status}
                  aria-label={`${displayName}: ${status}`}
                >
                  <span className={`status-dot status-dot--solid ${status}`} />
                  <span className="friend-status__label">{status}</span>
                </div>
              </div>

              {platePlacements.length > 0 ? (
                <div className="friend-info friend-info--nameplate">
                  <PlayerNamePlate
                    playerName={displayName}
                    placements={platePlacements}
                    interactive={false}
                    className="friend-nameplate"
                  />
                  <div className="friend-id-sub">{friend.id}</div>
                </div>
              ) : (
                <div className="friend-info friend-info--text">
                  <div className="friend-name">{displayName}</div>
                  <div className="friend-id-sub">{friend.id}</div>
                </div>
              )}

              {activityItems.length > 0 ? (
                <FriendActivityBlock
                  items={activityItems}
                  ariaLabel={`Recent skill activity: ${displayName}`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
