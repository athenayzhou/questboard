import { useGLTF, Html } from "@react-three/drei"
import { useOverlay } from "../store/overlay"
import { useMemo } from "react";
import * as THREE from "three";

type ModelProps = {
  src: string
  position?: [number, number, number]
  scale?: number | [number, number, number]
  rotation?: [number, number, number]
  overlay?: "profile"| "quests" | "logs" | "friends" | "skills" | "settings" | null
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

  const htmlPortal = useMemo(
    () => document.getElementById("html-layer"),
    []
  )

  return(
    <group
      position={position}
      rotation={rotation}
      onClick={() => overlay && openOverlay(overlay)}
    >
      <primitive scale={scale} object={clonedScene} />
      {label && htmlPortal && (
        <Html
          position={[0, 2, 0]}
          portal={{ current: htmlPortal }}
          transform
          center
          distanceFactor={5}
          wrapperClass="label-wrapper"
          >
          <div className="label">
            <span>{label}</span>
          </div>
        </Html>
      )}
    </group>
  )
}

useGLTF.preload("./model/mirror.glb");
useGLTF.preload("./model/bulletin.glb");
useGLTF.preload("./model/phone.glb");
useGLTF.preload("./model/tree.glb");
useGLTF.preload("./model/toolbox.glb");