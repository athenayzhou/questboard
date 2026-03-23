import { useState } from "react";
import { createPortal } from "react-dom";
import { useOverlay } from "../../store/overlay";
import { submitFeedback } from "../../lib/apiFeedback";
import { showToast } from "../../utils/toast";
import { IconX } from "../ui/icons";

const ERRORS: Record<string, string> = {
  body_required: "please enter a message",
  body_too_long: "message is too long",
  invalid_json: "invalid request",
  unknown: "could not send. try again",
};

export function Feedback() {
  const openOverlay = useOverlay((s) => s.openOverlay);
  const [kind, setKind] = useState<"feedback" | "problem">("feedback");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const portalTarget = typeof document !== "undefined" ? document.body : null;
  if (!portalTarget) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = body.trim();
    if (!trimmed) {
      showToast("warning", "write something first");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitFeedback({ kind, body: trimmed });
      if (result.ok) {
        showToast("success", "thanks. we got your message");
        setBody("");
        openOverlay("settings");
      } else {
        showToast(
          "error",
          ERRORS[result.error] ?? ERRORS.unknown,
        );
      }
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <>
      <div
        className="overlay-backdrop"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) openOverlay("settings");
        }}
      />
      <div className="overlay feedback-overlay">
        <div className="header feedback-header">
          <h2>feedback</h2>
          <div className="header-actions">
            <button
              type="button"
              className="close"
              onClick={() => openOverlay("settings")}
              aria-label="Back to settings"
              title="Back to settings"
            >
              <IconX size={18} />
            </button>
          </div>
        </div>
        <form className="feedback-form" onSubmit={handleSubmit}>
          <label className="feedback-field">
            <span className="feedback-label">type</span>
            <select
              className="feedback-select"
              value={kind}
              onChange={(e) =>
                setKind(e.target.value === "problem" ? "problem" : "feedback")
              }
            >
              <option value="feedback">feedback</option>
              <option value="problem">problem</option>
            </select>
          </label>
          <label className="feedback-field">
            <span className="feedback-label">message</span>
            <textarea
              className="feedback-textarea"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              maxLength={8000}
              placeholder="what happened? what would help?"
              required
            />
          </label>
          <div className="feedback-actions">
            <button
              type="button"
              className="feedback-btn feedback-btn--ghost"
              onClick={() => openOverlay("settings")}
            >
              cancel
            </button>
            <button
              type="submit"
              className="feedback-btn feedback-btn--primary"
              disabled={submitting}
            >
              {submitting ? "sending…" : "send"}
            </button>
          </div>
        </form>
      </div>
    </>,
    portalTarget,
  );
}
