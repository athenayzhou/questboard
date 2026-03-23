"use client";

import { useGLTF, Html } from "@react-three/drei"
import { useFrame } from "@react-three/fiber";
import { useOverlay } from "../store/overlay"
import { useLayoutEffect, useMemo, useRef } from "react";
import { useEffectiveTutorialSpotlight } from "../onboarding/useEffectiveTutorialSpotlight";
import { useTutorialStore } from "../onboarding/tutorialStore";
import * as THREE from "three";

const SPOTLIGHT_EMISSIVE = new THREE.Color(0x7edd6a);

type ModelProps = {
  src: string
  position?: [number, number, number]
  scale?: number | [number, number, number]
  rotation?: [number, number, number]
  overlay?:
    | "profile"
    | "quests"
    | "logs"
    | "friends"
    | "skills"
    | "settings"
    | "feedback"
    | null;
  label?: string
  hideMesh?: string[]
}

function useClonedScene(
  gltfScene: THREE.Group,
  hideMesh?: string[],
) {
  return useMemo(() => {
    const clone = gltfScene.clone(true);
    const hideMeshs = new Set((hideMesh ?? []).map((n) => n.toLowerCase()));

    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        const nameLower = (node.name ?? "").toLowerCase();
        if (hideMeshs.size && nameLower && hideMeshs.has(nameLower)) {
          node.visible = false;
        }
        if (node.visible && node.material) {
          const mat = Array.isArray(node.material) ? node.material[0] : node.material;
          if (mat && mat instanceof THREE.MeshStandardMaterial) {
            mat.envMapIntensity = 0.7;
            mat.roughness = Math.min(1, (mat.roughness ?? 0.5) + 0.15);
          }
        }
      }
    });
    return clone;
  }, [gltfScene, hideMesh]);
}

type MatSnapshot = {
  emissive: THREE.Color;
  emissiveIntensity: number;
  opacity: number;
  transparent: boolean;
  toneMapped: boolean;
};

function useTutorialSceneMeshHighlight(
  root: THREE.Object3D,
  spotlight: boolean,
  dimmed: boolean,
) {
  const originals = useRef(
    new WeakMap<THREE.MeshStandardMaterial, MatSnapshot>(),
  );

  useLayoutEffect(() => {
    const originalsMap = originals.current;
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh) || !node.visible) return;
      const mats = Array.isArray(node.material)
        ? node.material
        : [node.material];
      for (const mat of mats) {
        if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
        if (!originalsMap.has(mat)) {
          originalsMap.set(mat, {
            emissive: mat.emissive.clone(),
            emissiveIntensity: mat.emissiveIntensity,
            opacity: mat.opacity,
            transparent: mat.transparent,
            toneMapped: mat.toneMapped,
          });
        }
        const orig = originalsMap.get(mat)!;
        if (dimmed) {
          mat.transparent = true;
          mat.opacity = 0.42;
          mat.emissive.copy(orig.emissive);
          mat.emissiveIntensity = orig.emissiveIntensity;
          mat.toneMapped = orig.toneMapped;
        } else if (!spotlight) {
          mat.opacity = orig.opacity;
          mat.transparent = orig.transparent;
          mat.emissive.copy(orig.emissive);
          mat.emissiveIntensity = orig.emissiveIntensity;
          mat.toneMapped = orig.toneMapped;
        } else {
          mat.opacity = orig.opacity;
          mat.transparent = orig.transparent;
          mat.toneMapped = false;
        }
      }
    });
    return () => {
      root.traverse((node) => {
        if (!(node instanceof THREE.Mesh) || !node.visible) return;
        const mats = Array.isArray(node.material)
          ? node.material
          : [node.material];
        for (const mat of mats) {
          if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
          const orig = originalsMap.get(mat);
          if (!orig) continue;
          mat.opacity = orig.opacity;
          mat.transparent = orig.transparent;
          mat.emissive.copy(orig.emissive);
          mat.emissiveIntensity = orig.emissiveIntensity;
          mat.toneMapped = orig.toneMapped;
        }
      });
    };
  }, [root, spotlight, dimmed]);

  useFrame(() => {
    if (!spotlight || dimmed) return;
    const t = performance.now() * 0.0025;
    const pulse = 0.52 + 0.38 * Math.sin(t) + 0.08 * Math.sin(t * 2.3);
    root.traverse((node) => {
      if (!(node instanceof THREE.Mesh) || !node.visible) return;
      const mats = Array.isArray(node.material)
        ? node.material
        : [node.material];
      for (const mat of mats) {
        if (!(mat instanceof THREE.MeshStandardMaterial)) continue;
        mat.emissive.copy(SPOTLIGHT_EMISSIVE);
        mat.emissiveIntensity = pulse;
      }
    });
  });
}

export function Model({
  src,
  position = [0,0,0],
  scale = 1,
  rotation = [0,0,0],
  overlay= null,
  label,
  hideMesh,
} : ModelProps) {
  const { scene } = useGLTF(src);
  const clonedScene = useClonedScene(scene, hideMesh);
  const openOverlay = useOverlay((s) => s.openOverlay);
  const tutorialSpotlight = useEffectiveTutorialSpotlight();
  const tutorialActive = useTutorialStore((s) => s.isActive);

  const htmlPortal = useMemo(
    () => document.getElementById("html-layer"),
    [],
  );

  const entrySpotlight = overlay ? (`entry-${overlay}` as const) : undefined;
  const isEntryStepTarget =
    Boolean(
      tutorialActive &&
        entrySpotlight &&
        tutorialSpotlight === entrySpotlight,
    );
  const isDimmedEntryDuringTutorial = Boolean(
    tutorialActive &&
      overlay &&
      tutorialSpotlight?.startsWith("entry-") &&
      entrySpotlight &&
      tutorialSpotlight !== entrySpotlight,
  );

  useTutorialSceneMeshHighlight(
    clonedScene,
    Boolean(overlay && isEntryStepTarget),
    Boolean(overlay && isDimmedEntryDuringTutorial),
  );

  return (
    <group
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        if (overlay) openOverlay(overlay);
      }}
    >
      <primitive scale={scale} object={clonedScene} />
      {label && htmlPortal && (
        <Html
          position={[0, 1.5, 0]}
          portal={{ current: htmlPortal }}
          transform
          center
          distanceFactor={5}
          className="scene-model-html-root"
        >
          <div
            className="scene-model-entry"
            role="button"
            tabIndex={0}
            aria-label={label ? `Open ${label}` : "Open panel"}
            onClick={(e) => {
              e.stopPropagation();
              if (overlay) openOverlay(overlay);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                if (overlay) openOverlay(overlay);
              }
            }}
          >
            <div
              className={
                "label scene-model-entry-label" +
                (isEntryStepTarget ? " label--tutorial-spotlight" : "") +
                (isDimmedEntryDuringTutorial ? " label--tutorial-dim" : "")
              }
            >
              <span>{label}</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

useGLTF.preload("/model/mirror.glb");
useGLTF.preload("/model/bulletin.glb");
useGLTF.preload("/model/phone.glb");
useGLTF.preload("/model/bonsai.glb");
useGLTF.preload("/model/toolbox.glb");