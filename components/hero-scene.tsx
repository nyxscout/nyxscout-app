"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import { AdditiveBlending, Color, Object3D } from "three";
import type { InstancedMesh, Mesh, Points } from "three";

const dummy = new Object3D();

function SignalTerrain() {
  const bars = useRef<InstancedMesh>(null);
  const sweep = useRef<Mesh>(null);
  const rows = 18;
  const cols = 34;

  const cells = useMemo(() => {
    const next = [];
    for (let z = 0; z < rows; z += 1) {
      for (let x = 0; x < cols; x += 1) {
        const cx = x - cols / 2;
        const cz = z - rows / 2;
        const wave = Math.sin(cx * 0.42) * 0.22 + Math.cos(cz * 0.6) * 0.18;
        const ridge = Math.exp(-Math.abs(cx + cz * 0.44) / 8) * 0.7;
        next.push({
          x: cx * 0.18,
          z: cz * 0.22,
          base: 0.08 + ridge + wave,
          phase: cx * 0.7 + cz * 0.42,
        });
      }
    }
    return next;
  }, []);

  const barColors = useMemo(() => {
    const palette = {
      violet: new Color("#8b5cf6"),
      indigo: new Color("#4f46e5"),
      teal: new Color("#2dd4bf"),
      amber: new Color("#f59e0b"),
      rose: new Color("#fb7185"),
    };
    return cells.map((cell, index) => {
      const mix = seeded(index, 71);
      if (cell.base > 0.86) return palette.teal.clone().lerp(palette.violet, mix * 0.24);
      if (cell.base > 0.62) return palette.violet.clone().lerp(palette.indigo, mix * 0.36);
      if (mix > 0.92) return palette.amber.clone().lerp(palette.rose, 0.28);
      return palette.indigo.clone().lerp(palette.violet, 0.22 + mix * 0.22);
    });
  }, [cells]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    if (bars.current) {
      cells.forEach((cell, index) => {
        const pulse = Math.sin(time * 1.4 + cell.phase) * 0.08;
        const height = Math.max(0.05, cell.base + pulse);
        dummy.position.set(cell.x, height / 2, cell.z);
        dummy.scale.set(1, height, 1);
        dummy.updateMatrix();
        bars.current?.setMatrixAt(index, dummy.matrix);
        bars.current?.setColorAt(index, barColors[index]);
      });
      bars.current.instanceMatrix.needsUpdate = true;
      if (bars.current.instanceColor) bars.current.instanceColor.needsUpdate = true;
      bars.current.rotation.y = -0.36 + Math.sin(time * 0.08) * 0.03;
    }

    if (sweep.current) {
      sweep.current.position.x = 0.75 + Math.sin(time * 0.55) * 2.2;
      sweep.current.material.opacity = 0.11 + Math.sin(time * 1.1) * 0.03;
    }
  });

  return (
    <group rotation={[-0.22, 0, 0]} position={[1.05, -0.8, 0]}>
      <instancedMesh ref={bars} args={[undefined, undefined, cells.length]} frustumCulled={false}>
        <boxGeometry args={[0.038, 1, 0.038]} />
        <meshStandardMaterial
          color="#a78bfa"
          emissive="#2a174f"
          emissiveIntensity={0.92}
          roughness={0.36}
          metalness={0.58}
          vertexColors
        />
      </instancedMesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <planeGeometry args={[7.2, 4.6, 1, 1]} />
        <meshBasicMaterial color="#101528" transparent opacity={0.5} />
      </mesh>
      <mesh ref={sweep} position={[0.75, 0.55, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[0.025, 1.05, 4.6]} />
        <meshBasicMaterial color="#22d3ee" transparent opacity={0.22} blending={AdditiveBlending} />
      </mesh>
    </group>
  );
}

function SignalParticles() {
  const points = useRef<Points>(null);
  const positions = useMemo(() => {
    const values = new Float32Array(260 * 3);
    for (let i = 0; i < 260; i += 1) {
      const t = seeded(i, 3);
      const angle = seeded(i, 7) * Math.PI * 2;
      const radius = 1.8 + seeded(i, 13) * 4.4;
      values[i * 3] = Math.cos(angle) * radius;
      values[i * 3 + 1] = -0.7 + t * 2.9;
      values[i * 3 + 2] = Math.sin(angle) * radius * 0.72;
    }
    return values;
  }, []);

  useFrame(({ clock }) => {
    if (!points.current) return;
    points.current.rotation.y = clock.elapsedTime * 0.025;
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={new Color("#67e8f9")} size={0.012} transparent opacity={0.52} blending={AdditiveBlending} />
    </points>
  );
}

export function HeroScene() {
  return (
    <div className="hero-canvas" aria-hidden="true">
      <Canvas camera={{ position: [0, 1.15, 5.2], fov: 39 }} dpr={[1, 1.75]} gl={{ alpha: true }}>
        <fog attach="fog" args={["#080812", 4.4, 9.4]} />
        <ambientLight intensity={0.84} />
        <directionalLight position={[2.4, 3.5, 3.2]} intensity={2.1} color="#eef2ff" />
        <pointLight position={[-2.8, 0.7, 2.2]} color="#8b5cf6" intensity={3.2} />
        <pointLight position={[2.6, 0.1, 1.2]} color="#22d3ee" intensity={1.8} />
        <pointLight position={[0.6, 1.8, 1.8]} color="#f59e0b" intensity={0.46} />
        <SignalParticles />
        <SignalTerrain />
      </Canvas>
    </div>
  );
}

function seeded(index: number, salt: number) {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}
