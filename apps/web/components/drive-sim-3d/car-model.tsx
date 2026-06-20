"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RefObject } from "react";
import type { CarState } from "../../lib/drive-sim/engine";
import { simToWorldAngle, simToWorldX, simToWorldZ } from "../../lib/drive-sim/coords";

interface Props {
  carRef: RefObject<CarState>;
  signalLeft: boolean;
  signalRight: boolean;
  steer: number;
  hideInCockpit?: boolean;
  headlights?: boolean;
}

function Wheel({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.28, z]} rotation={[0, 0, Math.PI / 2]} castShadow>
      <cylinderGeometry args={[0.32, 0.32, 0.22, 16]} />
      <meshStandardMaterial color="#111827" roughness={0.9} />
    </mesh>
  );
}

export function CarModel({ carRef, signalLeft, signalRight, steer, hideInCockpit, headlights }: Props) {
  const group = useRef<THREE.Group>(null);
  const bodyMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#2563eb", metalness: 0.55, roughness: 0.35 }),
    [],
  );
  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#93c5fd",
        metalness: 0.2,
        roughness: 0.1,
        transparent: true,
        opacity: 0.75,
      }),
    [],
  );
  const signalL = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f59e0b", emissive: "#f59e0b", emissiveIntensity: 0 }),
    [],
  );
  const signalR = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f59e0b", emissive: "#f59e0b", emissiveIntensity: 0 }),
    [],
  );

  useFrame((_, delta) => {
    const car = carRef.current;
    const g = group.current;
    if (!car || !g) return;

    const tx = simToWorldX(car.x);
    const tz = simToWorldZ(car.y);
    g.position.lerp(new THREE.Vector3(tx, 0, tz), 1 - Math.pow(0.001, delta));
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, simToWorldAngle(car.angle), 1 - Math.pow(0.001, delta));

    const blink = Math.sin(Date.now() * 0.008) > 0;
    signalL.emissiveIntensity = signalLeft && blink ? 2.5 : 0;
    signalR.emissiveIntensity = signalRight && blink ? 2.5 : 0;
  });

  const steerRad = (carRef.current?.steerAngle ?? steer) * 0.55;

  return (
    <group ref={group} visible={!hideInCockpit}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow material={bodyMat}>
        <boxGeometry args={[1.85, 0.55, 4.2]} />
      </mesh>
      <mesh position={[0, 1.05, -0.15]} castShadow material={glassMat}>
        <boxGeometry args={[1.55, 0.45, 2.2]} />
      </mesh>
      <mesh position={[0, 0.62, 1.95]} castShadow material={bodyMat}>
        <boxGeometry args={[1.7, 0.35, 0.5]} />
      </mesh>
      <mesh position={[-0.95, 0.65, 1.6]} material={signalL}>
        <boxGeometry args={[0.08, 0.15, 0.25]} />
      </mesh>
      <mesh position={[0.95, 0.65, 1.6]} material={signalR}>
        <boxGeometry args={[0.08, 0.15, 0.25]} />
      </mesh>
      <group rotation={[0, steerRad, 0]}>
        <Wheel x={-0.85} z={1.35} />
        <Wheel x={0.85} z={1.35} />
      </group>
      <Wheel x={-0.85} z={-1.35} />
      <Wheel x={0.85} z={-1.35} />
      {headlights ? (
        <>
          <spotLight position={[0.7, 0.55, 2.1]} angle={0.42} intensity={2.2} distance={16} color="#fffbeb" />
          <spotLight position={[-0.7, 0.55, 2.1]} angle={0.42} intensity={2.2} distance={16} color="#fffbeb" />
        </>
      ) : (
        <pointLight position={[0, 0.8, 2.2]} intensity={signalLeft || signalRight ? 0.4 : 0.15} color="#fffbeb" distance={6} />
      )}
    </group>
  );
}
