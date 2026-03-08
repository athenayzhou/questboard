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
  hide?: string[]
}

function useClonedScene(
  gltfScene: THREE.Group,
  hide?: string[],
) {
  return useMemo(() => {
    const clone = gltfScene.clone(true);
    const hideMesh = new Set((hide ?? []).map((n) => n.toLowerCase()));

    clone.traverse((node) => {
      if (node instanceof THREE.Mesh) {
        const nameLower = (node.name ?? "").toLowerCase();
        if (hideMesh.size && nameLower && hideMesh.has(nameLower)) {
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
  }, [gltfScene, hide]);
}

export function Model({
  src,
  position = [0,0,0],
  scale = 1,
  rotation = [0,0,0],
  overlay= null,
  label,
  hide,
} : ModelProps) {
  const { scene } = useGLTF(src);
  const clonedScene = useClonedScene(scene, hide);
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
          position={[0, 1.5, 0]} 
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

useGLTF.preload("./mirror.glb");
useGLTF.preload("./bulletin.glb");
useGLTF.preload("./phone.glb");
useGLTF.preload("./tree.glb");
useGLTF.preload("./toolbox.glb");