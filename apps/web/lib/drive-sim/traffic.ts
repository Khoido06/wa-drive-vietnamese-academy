/** AI traffic vehicles for driving simulator. */

import type { SimScenario } from "./scenarios";

export interface AiVehicle {
  id: string;
  x: number;
  y: number;
  angle: number;
  speed: number;
  color: string;
  kind: "moving" | "parked";
  label?: string;
}

export function spawnTraffic(scenario: SimScenario): AiVehicle[] {
  switch (scenario.id) {
    case "lane_change":
      return [
        {
          id: "blind-spot",
          x: 280,
          y: scenario.laneYs?.[1] ?? 340,
          angle: 0,
          speed: 0,
          color: "#dc2626",
          kind: "parked",
          label: "Điểm mù",
        },
        {
          id: "lane-ahead",
          x: 520,
          y: scenario.laneYs?.[1] ?? 340,
          angle: 0,
          speed: 2.2,
          color: "#64748b",
          kind: "moving",
        },
        {
          id: "far-lane",
          x: 350,
          y: scenario.laneYs?.[0] ?? 220,
          angle: 0,
          speed: 3.1,
          color: "#475569",
          kind: "moving",
        },
      ];
    case "enter_exit_traffic":
      return [
        {
          id: "main-1",
          x: 550,
          y: scenario.laneYs?.[1] ?? 340,
          angle: 0,
          speed: 2.8,
          color: "#334155",
          kind: "moving",
        },
        {
          id: "main-2",
          x: 680,
          y: scenario.laneYs?.[2] ?? 460,
          angle: 0,
          speed: 2.4,
          color: "#1e293b",
          kind: "moving",
        },
        {
          id: "oncoming",
          x: 620,
          y: scenario.laneYs?.[0] ?? 220,
          angle: Math.PI,
          speed: 2.6,
          color: "#0f766e",
          kind: "moving",
        },
      ];
    case "parallel_parking":
      return [
        {
          id: "rear-park",
          x: 560,
          y: 188,
          angle: 0,
          speed: 0,
          color: "#78716c",
          kind: "parked",
        },
      ];
    case "backing_corner":
      return [
        {
          id: "parked-side",
          x: 200,
          y: 250,
          angle: Math.PI / 2,
          speed: 0,
          color: "#57534e",
          kind: "parked",
        },
      ];
    default:
      return [];
  }
}

export function updateTraffic(vehicles: AiVehicle[], worldW = 800): void {
  for (const v of vehicles) {
    if (v.kind !== "moving") continue;
    v.x += Math.cos(v.angle) * v.speed;
    v.y += Math.sin(v.angle) * v.speed;
    if (v.x > worldW + 60) {
      v.x = -40;
    }
    if (v.x < -60) {
      v.x = worldW + 40;
    }
  }
}
