/* eslint-disable @next/next/no-img-element -- small billboard textures in Html portal */
"use client";

import { Html } from "@react-three/drei";
import { useMemo } from "react";
import { useUserStore } from "../store/user";
import type { EquipSlot } from "../types/system";
import { SYSTEM_ITEMS_BY_ID, getItemIconUrl } from "../data/systemItems";
import { DEFAULT_CHARACTER_IMAGE } from "../lib/defaultUserData";

const EQUIP_SLOTS: EquipSlot[] = ["head", "body", "accessory", "weapon"];

type FigureProps = {
  position?: [number, number, number];
  distanceFactor?: number;
};

export function Figure({
  position = [-1.35, 2.48, 0.15],
  distanceFactor = 8,
}: FigureProps) {
  const equipment = useUserStore((s) => s.user.equipment.equipped);

  const htmlPortal = useMemo(
    () => document.getElementById("html-layer"),
    [],
  );

  const equippedBySlot = useMemo(() => {
    const out: Partial<
      Record<EquipSlot, (typeof SYSTEM_ITEMS_BY_ID)[string]>
    > = {};
    for (const slot of EQUIP_SLOTS) {
      const id = equipment[slot];
      if (id && SYSTEM_ITEMS_BY_ID[id]) {
        out[slot] = SYSTEM_ITEMS_BY_ID[id];
      }
    }
    return out;
  }, [equipment]);

  if (!htmlPortal) return null;

  return (
    <group position={position}>
      <Html
        position={[0, 0, 0]}
        portal={{ current: htmlPortal }}
        transform
        center
        distanceFactor={distanceFactor}
        className="scene-donna-html-root"
        occlude={false}
      >
        <div className="scene-donna-wrap">
          <div className="scene-donna-composite">
            <img
              src={DEFAULT_CHARACTER_IMAGE}
              alt=""
              className="scene-donna-base"
              draggable={false}
            />
            <div className="scene-donna-equip-layers" aria-hidden>
              {equippedBySlot.body ? (
                <img
                  src={getItemIconUrl(equippedBySlot.body.id)}
                  alt=""
                  className="scene-donna-equip scene-donna-equip--body"
                />
              ) : null}
              {equippedBySlot.head ? (
                <img
                  src={getItemIconUrl(equippedBySlot.head.id)}
                  alt=""
                  className="scene-donna-equip scene-donna-equip--head"
                />
              ) : null}
              {equippedBySlot.accessory ? (
                <img
                  src={getItemIconUrl(equippedBySlot.accessory.id)}
                  alt=""
                  className="scene-donna-equip scene-donna-equip--accessory"
                />
              ) : null}
              {equippedBySlot.weapon ? (
                <img
                  src={getItemIconUrl(equippedBySlot.weapon.id)}
                  alt=""
                  className="scene-donna-equip scene-donna-equip--weapon"
                />
              ) : null}
            </div>
          </div>
        </div>
      </Html>
    </group>
  );
}
