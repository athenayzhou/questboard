"use client";

import { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { useTutorialStore } from "./tutorialStore";

const TUTORIAL_Z_MASK = 500000;
const TUTORIAL_Z_RING = 500001;

type ViewportRect = { top: number; left: number; width: number; height: number };

function boundsForSpotlightId(id: string): ViewportRect | null {
  const list = document.querySelectorAll(
    `[data-spotlight="${CSS.escape(id)}"]`,
  );
  if (list.length === 0) return null;
  if (list.length === 1) {
    const r = list[0].getBoundingClientRect();
    return { top: r.top, left: r.left, width: r.width, height: r.height };
  }
  let minL = Infinity;
  let minT = Infinity;
  let maxR = -Infinity;
  let maxB = -Infinity;
  list.forEach((node) => {
    const r = (node as HTMLElement).getBoundingClientRect();
    minL = Math.min(minL, r.left);
    minT = Math.min(minT, r.top);
    maxR = Math.max(maxR, r.right);
    maxB = Math.max(maxB, r.bottom);
  });
  return {
    left: minL,
    top: minT,
    width: maxR - minL,
    height: maxB - minT,
  };
}

function useClientMounted() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

export type TutorialSpotlightProps = {
  activeSpotlight?: string;
};

export function TutorialSpotlight({ activeSpotlight }: TutorialSpotlightProps) {
  const mounted = useClientMounted();
  const [targetRect, setTargetRect] = useState<ViewportRect | null>(null);
  const [targetVisibleInViewport, setTargetVisibleInViewport] = useState(true);
  const rafRef = useRef<number | null>(null);
  const { hasSeen, markSeen } = useTutorialStore();

  useEffect(() => {
    if (!activeSpotlight) return;

    const id = activeSpotlight;
    const tick = () => {
      const rect = boundsForSpotlightId(id);
      if (!rect || rect.width <= 0 || rect.height <= 0) {
        setTargetRect(null);
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      setTargetRect(rect);
      rafRef.current = requestAnimationFrame(tick);
    };

    tick();

    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      setTargetRect(null);
    };
  }, [activeSpotlight]);

  useEffect(() => {
    if (!activeSpotlight) return;

    const list = document.querySelectorAll(
      `[data-spotlight="${CSS.escape(activeSpotlight)}"]`,
    );
    if (list.length === 0) {
      queueMicrotask(() => setTargetVisibleInViewport(true));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const anyVisible = entries.some(
          (e) => e.isIntersecting && (e.intersectionRatio ?? 0) > 0.01,
        );
        setTargetVisibleInViewport(anyVisible);
      },
      { root: null, rootMargin: "0px", threshold: [0, 0.01, 0.05, 0.1, 0.25, 0.5, 1] },
    );
    list.forEach((el) => io.observe(el));
    return () => {
      io.disconnect();
      setTargetVisibleInViewport(true);
    };
  }, [activeSpotlight]);

  useEffect(() => {
    if (activeSpotlight && !hasSeen(activeSpotlight)) {
      markSeen(activeSpotlight);
    }
  }, [activeSpotlight, hasSeen, markSeen]);

  if (!mounted || typeof document === "undefined") return null;

  const ringIgnoresViewport =
    activeSpotlight === "active-strip" || activeSpotlight === "active-handle";

  const showRing =
    Boolean(activeSpotlight) &&
    targetRect != null &&
    targetRect.width > 0 &&
    targetRect.height > 0 &&
    (targetVisibleInViewport || ringIgnoresViewport);

  const suppressDimForReadability =
    Boolean(activeSpotlight) &&
    (activeSpotlight?.startsWith("addq-") ||
      activeSpotlight?.startsWith("qp-"));

  const showFullScreenDim =
    Boolean(activeSpotlight) &&
    !suppressDimForReadability &&
    !showRing &&
    activeSpotlight != null &&
    !activeSpotlight.startsWith("entry-");

  return createPortal(
    <>
      {showFullScreenDim && (
        <div
          className="tutorial-mask tutorial-mask--dim"
          aria-hidden
          style={{
            position: "fixed",
            inset: 0,
            zIndex: TUTORIAL_Z_MASK,
            pointerEvents: "none",
          }}
        />
      )}

      {showRing && targetRect && activeSpotlight && (
        <>
          {!suppressDimForReadability && (
            <div
              className="tutorial-spotlight-dim-spread"
              aria-hidden
              style={{
                position: "fixed",
                top: targetRect.top,
                left: targetRect.left,
                width: targetRect.width,
                height: targetRect.height,
                zIndex: TUTORIAL_Z_MASK,
                pointerEvents: "none",
              }}
            />
          )}
          <div
            className="tutorial-spotlight"
            style={{
              position: "fixed",
              top: targetRect.top,
              left: targetRect.left,
              width: targetRect.width,
              height: targetRect.height,
              zIndex: TUTORIAL_Z_RING,
              pointerEvents: "none",
            }}
          />
        </>
      )}
    </>,
    document.body,
  );
}
