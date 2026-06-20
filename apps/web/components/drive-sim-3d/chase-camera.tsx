"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { RefObject } from "react";
import type { CarState } from "../../lib/drive-sim/engine";
import { simToWorldX, simToWorldZ } from "../../lib/drive-sim/coords";

interface Props {
  carRef: RefObject<CarState>;
}

export function ChaseCamera({ carRef }: Props) {
  const { camera } = useThree();
  const lookAt = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    const car = carRef.current;
    if (!car) return;

    const cx = simToWorldX(car.x);
    const cz = simToWorldZ(car.y);
    const dist = 9 + Math.min(Math.abs(car.speed) * 0.8, 4);
    const height = 5.5 + Math.min(Math.abs(car.speed) * 0.15, 1.5);

    const backX = cx - Math.cos(car.angle) * dist;
    const backZ = cz - Math.sin(car.angle) * dist;

    const targetPos = new THREE.Vector3(backX, height, backZ);
    camera.position.lerp(targetPos, 1 - Math.pow(0.00008, delta));
    lookAt.current.set(cx, 0.8, cz);
    camera.lookAt(lookAt.current);
  });

  return null;
}
