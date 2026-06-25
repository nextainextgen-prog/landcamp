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
// Deterministic pseudo-random in [0, 1) from a seed. Pure (no Math.random),
// so it can run during render without violating React's purity rule while
// still scattering the particles so the field doesn't look mechanical.
function seeded(n: number): number {
  const x = Math.sin(n) * 43758.5453;
  return x - Math.floor(x);
}

function Dust({ count = 90 }: { count?: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const positions = useMemo(() => {
    const arr: { x: number; y: number; z: number; speed: number; drift: number; size: number }[] =
      [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (seeded(i * 12.9898 + 1) - 0.5) * 12,
        y: (seeded(i * 78.233 + 2) - 0.5) * 8,
        z: (seeded(i * 37.719 + 3) - 0.5) * 4,
        speed: 0.04 + seeded(i * 19.123 + 4) * 0.08,
        drift: (seeded(i * 51.07 + 5) - 0.5) * 0.4,
        size: 0.012 + seeded(i * 93.41 + 6) * 0.022,
      });
    }
    return arr;
  }, [count]);

  useFrame((state) => {
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
