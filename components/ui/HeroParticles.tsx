"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

/**
 * Floating dust particles drifting upward — adds organic depth
 * to the hero scene. Rendered only on desktop/large viewports for
 * performance.
 *
 * Uses InstancedMesh with sprite billboards. Rotation, position and
 * size jitter per instance so the field never feels mechanical.
 */
function Dust({ count = 90 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => {
    const arr: { x: number; y: number; z: number; speed: number; drift: number; size: number }[] =
      [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 12,
        y: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 4,
        speed: 0.04 + Math.random() * 0.08,
        drift: (Math.random() - 0.5) * 0.4,
        size: 0.012 + Math.random() * 0.022,
      });
    }
    return arr;
  }, [count]);

  useFrame((state, dt) => {
    if (!mesh.current) return;
    const dummy = new THREE.Object3D();
    const time = state.clock.elapsedTime;

    positions.forEach((p, i) => {
      const y = ((p.y + time * p.speed) % 8) - 4;
      const x = p.x + Math.sin(time * 0.3 + i) * p.drift * 0.5;
      dummy.position.set(x, y, p.z);
      dummy.scale.setScalar(p.size);
      dummy.updateMatrix();
      mesh.current!.setMatrixAt(i, dummy.matrix);
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        color="#f5f1ea"
        transparent
        opacity={0.55}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

export function HeroParticles() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ mixBlendMode: "screen" }}
    >
      <Canvas
        gl={{ alpha: true, antialias: true }}
        dpr={[1, 1.6]}
        camera={{ position: [0, 0, 6], fov: 60 }}
      >
        <Dust count={70} />
      </Canvas>
    </div>
  );
}
