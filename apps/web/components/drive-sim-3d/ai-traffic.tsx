"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { RefObject } from "react";
import type { AiVehicle } from "../../lib/drive-sim/traffic";
import { simToWorldAngle, simToWorldX, simToWorldZ } from "../../lib/drive-sim/coords";

function AiCarNode({
  trafficRef,
  vehicleId,
  headlights,
}: {
  trafficRef: RefObject<AiVehicle[]>;
  vehicleId: string;
  headlights: boolean;
}) {
  const group = useRef<THREE.Group>(null);
  const bodyMat = useRef(new THREE.MeshStandardMaterial({ metalness: 0.45, roughness: 0.45 }));

  useFrame(() => {
    const v = trafficRef.current?.find((t) => t.id === vehicleId);
    const g = group.current;
    if (!v || !g) return;
    g.position.set(simToWorldX(v.x), 0, simToWorldZ(v.y));
    g.rotation.y = simToWorldAngle(v.angle);
    bodyMat.current.color.set(v.color);
  });

  return (
    <group ref={group}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow material={bodyMat.current}>
        <boxGeometry args={[1.85, 0.55, 4.2]} />
      </mesh>
      <mesh position={[0, 1.05, -0.15]} castShadow>
        <boxGeometry args={[1.55, 0.45, 2.2]} />
        <meshStandardMaterial color="#1e293b" roughness={0.25} />
      </mesh>
      {headlights ? (
        <>
          <spotLight position={[0.7, 0.7, 2]} angle={0.45} intensity={1.8} distance={14} color="#fffbeb" />
          <spotLight position={[-0.7, 0.7, 2]} angle={0.45} intensity={1.8} distance={14} color="#fffbeb" />
        </>
      ) : null}
    </group>
  );
}

interface Props {
  trafficRef: RefObject<AiVehicle[]>;
  vehicleIds: string[];
  headlights: boolean;
}

export function AiTraffic({ trafficRef, vehicleIds, headlights }: Props) {
  return (
    <group>
      {vehicleIds.map((id) => (
        <AiCarNode key={id} trafficRef={trafficRef} vehicleId={id} headlights={headlights} />
      ))}
    </group>
  );
}
