"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Sky, Stars } from "@react-three/drei";

export type WeatherMode = "day" | "night" | "rain";

interface Props {
  mode: WeatherMode;
}

function RainParticles({ active }: { active: boolean }) {
  const count = 800;
  const points = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 50;
      arr[i * 3 + 1] = Math.random() * 25 + 2;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (!active || !points.current) return;
    const pos = points.current.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      let y = pos.getY(i) - delta * 18;
      if (y < 0) y = 20 + Math.random() * 5;
      pos.setY(i, y);
    }
    pos.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.08} color="#93c5fd" transparent opacity={0.65} depthWrite={false} />
    </points>
  );
}

function StreetLights({ active }: { active: boolean }) {
  if (!active) return null;
  const spots: Array<[number, number, number]> = [
    [-8, 0, -6],
    [8, 0, -6],
    [-8, 0, 6],
    [8, 0, 6],
    [0, 0, 0],
  ];
  return (
    <group>
      {spots.map(([x, , z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 2.8, 0]}>
            <cylinderGeometry args={[0.06, 0.08, 5.6, 8]} />
            <meshStandardMaterial color="#44403c" />
          </mesh>
          <pointLight position={[0, 5, 0]} intensity={1.2} distance={14} color="#fde68a" />
          <mesh position={[0, 5.2, 0]}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#fef3c7" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

export function WeatherScene({ mode }: Props) {
  const isNight = mode === "night" || mode === "rain";
  const isRain = mode === "rain";

  return (
    <>
      {isNight ? (
        <>
          <color attach="background" args={["#0f172a"]} />
          <Stars radius={80} depth={50} count={2000} factor={3} fade speed={0.5} />
          <ambientLight intensity={0.12} />
          <directionalLight position={[10, 20, 5]} intensity={0.25} color="#94a3b8" />
          <hemisphereLight args={["#1e3a5f", "#0c0a09", 0.2]} />
        </>
      ) : (
        <>
          <Sky sunPosition={[80, 40, 60]} turbidity={4} rayleigh={0.5} mieCoefficient={0.005} />
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[25, 35, 18]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-camera-far={90}
            shadow-camera-left={-35}
            shadow-camera-right={35}
            shadow-camera-top={35}
            shadow-camera-bottom={-35}
          />
          <hemisphereLight args={["#87ceeb", "#44403c", 0.35]} />
        </>
      )}
      <fog attach="fog" args={[isNight ? "#0f172a" : isRain ? "#64748b" : "#b8c4d0", 35, isRain ? 70 : 100]} />
      <StreetLights active={isNight} />
      <RainParticles active={isRain} />
    </>
  );
}
