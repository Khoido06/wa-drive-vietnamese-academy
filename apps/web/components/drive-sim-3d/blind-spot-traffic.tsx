"use client";

import type { SimScenario } from "../../lib/drive-sim/scenarios";
import { simToWorldX, simToWorldZ } from "../../lib/drive-sim/coords";

/** AI car in blind spot for lane-change training. */
export function BlindSpotTraffic({ scenario }: { scenario: SimScenario }) {
  if (scenario.id !== "lane_change" || !scenario.laneYs) return null;

  const blindY = scenario.laneYs[1] ?? 340;
  const wx = simToWorldX(280);
  const wz = simToWorldZ(blindY);

  return (
    <group position={[wx, 0, wz]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[1.85, 0.55, 4.2]} />
        <meshStandardMaterial color="#dc2626" metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 1.05, -0.15]} castShadow>
        <boxGeometry args={[1.55, 0.45, 2.2]} />
        <meshStandardMaterial color="#450a0a" roughness={0.3} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <planeGeometry args={[5, 2.5]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}
