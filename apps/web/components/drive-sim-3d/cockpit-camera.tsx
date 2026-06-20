"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RefObject } from "react";
import type { CarState } from "../../lib/drive-sim/engine";
import { simToWorldAngle, simToWorldX, simToWorldZ } from "../../lib/drive-sim/coords";

interface Props {
  carRef: RefObject<CarState>;
  active: boolean;
}

export function CockpitCamera({ carRef, active }: Props) {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!active) return;
    const car = carRef.current;
    if (!car) return;

    const wx = simToWorldX(car.x);
    const wz = simToWorldZ(car.y);
    const rot = simToWorldAngle(car.angle);
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    const eyeX = wx + sin * 0.35;
    const eyeZ = wz - cos * 0.35;
    camera.position.lerp(new THREE.Vector3(eyeX, 1.05, eyeZ), 1 - Math.pow(0.00005, delta));

    lookAt.current.set(wx + cos * 8, 0.9, wz + sin * 8);
    camera.lookAt(lookAt.current);
  });

  return null;
}

export function CockpitInterior({ carRef, visible }: { carRef: RefObject<CarState>; visible: boolean }) {
  const dash = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!visible || !dash.current) return;
    const car = carRef.current;
    if (!car) return;
    dash.current.position.set(simToWorldX(car.x), 0.55, simToWorldZ(car.y));
    dash.current.rotation.y = simToWorldAngle(car.angle);
  });

  if (!visible) return null;

  return (
    <group ref={dash}>
      <mesh position={[0, 0.35, 0.8]}>
        <boxGeometry args={[1.6, 0.5, 0.15]} />
        <meshStandardMaterial color="#1c1917" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.55, 0.65]}>
        <boxGeometry args={[1.2, 0.08, 0.4]} />
        <meshStandardMaterial color="#292524" emissive="#2563eb" emissiveIntensity={0.15} />
      </mesh>
    </group>
  );
}
