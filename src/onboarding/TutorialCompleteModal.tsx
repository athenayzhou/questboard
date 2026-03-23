"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTutorialStore } from "./tutorialStore";

export function TutorialCompleteModal() {
  const open = useTutorialStore((s) => s.tutorialCompleteModalOpen);
  const close = useTutorialStore((s) => s.closeTutorialCompleteModal);
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeBtnRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!open) return null;

  const dialog = (
    <div
      className="tutorial-complete-overlay"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        className="tutorial-complete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tutorial-complete-title"
        aria-describedby="tutorial-complete-desc"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="tutorial-complete-dialog__accent" aria-hidden />
        <h2 id="tutorial-complete-title" className="tutorial-complete-dialog__title">
          tutorial complete
        </h2>
        <p id="tutorial-complete-desc" className="tutorial-complete-dialog__body">
          you are now ready to explore the questboard on your own
        </p>
        <button
          ref={closeBtnRef}
          type="button"
          className="tutorial-complete-dialog__close"
          onClick={close}
        >
          yay
        </button>
      </div>
    </div>
  );

  return createPortal(dialog, document.body);
}
