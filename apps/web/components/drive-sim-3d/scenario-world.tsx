"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Text } from "@react-three/drei";
import type { SimScenario } from "../../lib/drive-sim/scenarios";
import { SIM_SCALE, simToWorldX, simToWorldZ } from "../../lib/drive-sim/coords";

function ParkedCar({ x, y, color = "#64748b" }: { x: number; y: number; color?: string }) {
  const wx = simToWorldX(x);
  const wz = simToWorldZ(y);
  return (
    <group position={[wx, 0, wz]}>
      <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.85, 0.55, 4.2]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.05, -0.15]} castShadow>
        <boxGeometry args={[1.55, 0.45, 2.2]} />
        <meshStandardMaterial color="#334155" roughness={0.2} metalness={0.3} />
      </mesh>
    </group>
  );
}

function Tree({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.6, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 1.2, 8]} />
        <meshStandardMaterial color="#78350f" />
      </mesh>
      <mesh position={[0, 1.6, 0]} castShadow>
        <coneGeometry args={[0.9, 1.8, 8]} />
        <meshStandardMaterial color="#15803d" />
      </mesh>
    </group>
  );
}

function Building({ x, z, h = 8 }: { x: number; z: number; h?: number }) {
  return (
    <mesh position={[x, h / 2, z]} castShadow receiveShadow>
      <boxGeometry args={[4, h, 4]} />
      <meshStandardMaterial color="#94a3b8" roughness={0.8} />
    </mesh>
  );
}

function RoadMarkings({ scenario }: { scenario: SimScenario }) {
  if (scenario.laneYs) {
    return (
      <>
        {scenario.laneYs.map((y) => (
          <mesh key={y} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, simToWorldZ(y)]}>
            <planeGeometry args={[80, 0.15]} />
            <meshStandardMaterial color="#fafafa" />
          </mesh>
        ))}
      </>
    );
  }
  return null;
}

export function ScenarioWorld({ scenario }: { scenario: SimScenario }) {
  const asphalt = useMemo(() => new THREE.MeshStandardMaterial({ color: "#44403c", roughness: 0.95 }), []);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[120, 120]} />
        <meshStandardMaterial color="#365314" roughness={1} />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow material={asphalt}>
        <planeGeometry args={[50, 50]} />
      </mesh>

      <RoadMarkings scenario={scenario} />

      {scenario.curbX ? (
        <mesh
          position={[simToWorldX(scenario.curbX) + 0.4, 0.25, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[0.8, 0.5, 50]} />
          <meshStandardMaterial color="#78716c" roughness={0.85} />
        </mesh>
      ) : null}

      {scenario.parkingZone ? (
        <group>
          {(() => {
            const z = scenario.parkingZone;
            const wx = simToWorldX(z.x + z.w / 2);
            const wz = simToWorldZ(z.y + z.h / 2);
            const ww = z.w * SIM_SCALE;
            const wh = z.h * SIM_SCALE;
            return (
              <>
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[wx, 0.03, wz]}>
                  <planeGeometry args={[ww, wh]} />
                  <meshStandardMaterial color="#22c55e" transparent opacity={0.25} />
                </mesh>
                <Text position={[wx, 0.5, wz - wh / 2 + 0.5]} fontSize={0.45} color="#16a34a" anchorX="center">
                  CHỖ ĐỖ
                </Text>
              </>
            );
          })()}
        </group>
      ) : null}

      {scenario.frontCar ? <ParkedCar x={scenario.frontCar.x} y={scenario.frontCar.y} /> : null}

      {scenario.stopLineX ? (
        <group position={[simToWorldX(scenario.stopLineX), 0, simToWorldZ(340)]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
            <planeGeometry args={[0.2, 8]} />
            <meshStandardMaterial color="#fafafa" />
          </mesh>
          <mesh position={[0.6, 1.2, -3]}>
            <boxGeometry args={[0.08, 2.4, 0.08]} />
            <meshStandardMaterial color="#57534e" />
          </mesh>
          <mesh position={[0.6, 2.8, -3]}>
            <octahedronGeometry args={[0.55, 0]} />
            <meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={0.3} />
          </mesh>
          <Text position={[0.6, 2.8, -2.2]} fontSize={0.35} color="#fff" anchorX="center">
            STOP
          </Text>
        </group>
      ) : null}

      {scenario.id === "backing_corner" ? (
        <mesh position={[simToWorldX(80) + 0.3, 0.25, simToWorldZ(310)]} castShadow>
          <boxGeometry args={[0.6, 0.5, 35]} />
          <meshStandardMaterial color="#78716c" />
        </mesh>
      ) : null}

      {/* Ambient city backdrop */}
      <Building x={-18} z={-15} h={12} />
      <Building x={-22} z={5} h={9} />
      <Building x={20} z={-12} h={14} />
      <Building x={16} z={10} h={7} />
      {(
        [
          [-12, -8],
          [-14, 8],
          [12, -6],
          [14, 12],
          [-8, 14],
          [8, -14],
        ] as const
      ).map(([x, z]) => (
        <Tree key={`${x}-${z}`} x={x} z={z} />
      ))}
    </group>
  );
}
