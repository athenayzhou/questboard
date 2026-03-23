import { useCallback, useRef } from "react";
import type { BadgePlatePlacement } from "@/types/user";
import { clamp01 } from "@/lib/userBadges";
import { SYSTEM_BADGES, getBadgeIconUrl } from "@/data/systemBadges";

type UserNamePlateProps = {
  userName: string;
  nameSlot?: React.ReactNode;
  placements: BadgePlatePlacement[];
  interactive?: boolean;
  onPlacementChange?: (badgeId: string, x: number, y: number) => void;
  className?: string;
};

export function UserNamePlate({
  userName,
  nameSlot,
  placements,
  interactive = false,
  onPlacementChange,
  className = "",
}: UserNamePlateProps) {
  const layerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ id: string } | null>(null);
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      const d = dragRef.current;
      const layer = layerRef.current;
      if (!d || !layer || !onPlacementChange) return;
      const r = layer.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const x = clamp01((e.clientX - r.left) / r.width);
      const y = clamp01((e.clientY - r.top) / r.height);
      onPlacementChange(d.id, x, y);
    },
    [onPlacementChange],
  );

  const endDrag = useCallback(function endDrag() {
    dragRef.current = null;
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", endDrag);
    window.removeEventListener("pointercancel", endDrag);
  }, [handlePointerMove]);

  const startDrag = useCallback(
    (badgeId: string, e: React.PointerEvent) => {
      if (!interactive || !onPlacementChange) return;
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = { id: badgeId };
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", endDrag);
      window.addEventListener("pointercancel", endDrag);
    },
    [interactive, onPlacementChange, handlePointerMove, endDrag],
  );

  const valid = placements.filter((p) => SYSTEM_BADGES[p.id]);

  return (
    <div className={`name-container ${className}`.trim()}>
      <div className="name-plate-body">
        <div
          ref={layerRef}
          className="name-plate-badge-layer"
          aria-hidden={valid.length === 0}
        >
          {valid.map((p) => {
            const def = SYSTEM_BADGES[p.id];
            return (
              <div
                key={p.id}
                className={`name-plate-badge nameplate-badge-draggable ${
                  interactive ? "nameplate-badge-draggable--interactive" : ""
                }`}
                style={{
                  left: `${p.x * 100}%`,
                  top: `${p.y * 100}%`,
                }}
                title={def.display}
                onPointerDown={(e) => startDrag(p.id, e)}
              >
                <img
                  src={getBadgeIconUrl(p.id)}
                  alt=""
                  className="name-plate-badge-img"
                  decoding="async"
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
        <div className="name-plate-name-center">
          {nameSlot ?? <div className="name-text">{userName}</div>}
        </div>
      </div>
    </div>
  );
}
