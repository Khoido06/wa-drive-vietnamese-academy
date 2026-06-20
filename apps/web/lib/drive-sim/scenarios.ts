import type { CarState } from "./engine";
import { createCar, distanceToCurb, parallelErrorDeg, pointInRect } from "./engine";

export interface SimScenario {
  id: string;
  titleVi: string;
  briefVi: string;
  tips: string[];
  init: () => CarState;
  curbX?: number;
  parkingZone?: { x: number; y: number; w: number; h: number };
  frontCar?: { x: number; y: number };
  stopLineX?: number;
  laneYs?: [number, number, number];
  goalLaneY?: number;
  hillMode?: "down-curb" | "up-curb" | "no-curb";
}

export interface SimResult {
  passed: boolean;
  score: number;
  message: string;
}

export const SIM_SCENARIOS: SimScenario[] = [
  {
    id: "parallel_parking",
    titleVi: "Đỗ song song",
    briefVi: "Lùi vào chỗ đỗ — cách lề ≤12 inch, song song lề",
    tips: [
      "Bật xi-nhan phải trước khi lùi",
      "Lùi chậm, quay vô-lăng từng chút",
      "Nhấn «Kiểm tra điểm» khi đã đỗ xong",
    ],
    init: () => createCar(180, 200, 0),
    curbX: 620,
    parkingZone: { x: 420, y: 160, w: 180, h: 100 },
    frontCar: { x: 380, y: 188 },
  },
  {
    id: "backing_corner",
    titleVi: "Lùi quanh góc",
    briefVi: "Lùi quanh góc phải, giữ sát lề (≤18 inch)",
    tips: [
      "Bật xi-nhan phải",
      "Chuyển số lùi, nhìn qua cửa sổ sau",
      "Lùi chậm, sát lề bên phải",
    ],
    init: () => createCar(120, 480, -Math.PI / 2),
    curbX: 620,
  },
  {
    id: "lane_change",
    titleVi: "Đổi làn",
    briefVi: "Xi-nhan → nhìn qua vai → đổi sang làn trái",
    tips: [
      "Bật xi-nhan trái trước",
      "Nhấn «Nhìn qua vai» rồi mới đổi làn",
      "Giữ tốc độ ổn định",
    ],
    init: () => createCar(200, 340, 0),
    laneYs: [220, 340, 460],
    goalLaneY: 220,
  },
  {
    id: "enter_exit_traffic",
    titleVi: "STOP & nhập làn",
    briefVi: "Dừng hẳn tại vạch STOP rồi đi khi an toàn",
    tips: [
      "Phanh hết ga trước vạch trắng",
      "Xe phải dừng hoàn toàn (speed = 0)",
      "Xi-nhan trái khi hòa nhập",
    ],
    init: () => createCar(140, 340, 0),
    stopLineX: 380,
    laneYs: [220, 340, 460],
  },
  {
    id: "hill_parking",
    titleVi: "Đỗ trên dốc",
    briefVi: "Chọn hướng quay bánh + phanh tay đúng",
    tips: [
      "Dốc xuống + lề: quay về lề",
      "Dốc lên + lề: quay ra xa lề",
      "Không lề: quay về rìa đường",
    ],
    init: () => createCar(400, 300, 0),
    hillMode: "down-curb",
  },
];

export function evaluateScenario(
  scenario: SimScenario,
  car: CarState,
  ctx: {
    signalLeft: boolean;
    signalRight: boolean;
    signalBeforeAction: boolean;
    headCheckRecent: boolean;
    stoppedAtLine: boolean;
    wheelChoice?: "toward-curb" | "away-curb" | "toward-edge";
    handbrake: boolean;
    inPark: boolean;
  },
): SimResult {
  switch (scenario.id) {
    case "parallel_parking": {
      const zone = scenario.parkingZone!;
      const cx = car.x;
      const cy = car.y;
      const inZone = pointInRect(cx, cy, zone.x, zone.y, zone.w, zone.h);
      const curbDist = scenario.curbX ? distanceToCurb(car, scenario.curbX) : 99;
      const parallel = parallelErrorDeg(car);
      const inches = Math.round((curbDist / 30) * 12);
      let score = 0;
      if (inZone) score += 40;
      if (curbDist <= 30) score += 30;
      if (parallel <= 12) score += 20;
      if (ctx.signalBeforeAction || ctx.signalRight) score += 10;
      const passed = inZone && curbDist <= 35 && parallel <= 15;
      return {
        passed,
        score,
        message: passed
          ? `✅ Đỗ tốt! Cách lề ~${inches} inch, góc ${parallel.toFixed(0)}°`
          : `Chưa đạt — ${!inZone ? "chưa vào vạch đỗ" : curbDist > 35 ? `cách lề ~${inches} inch (cần ≤12)` : `xe nghiêng ${parallel.toFixed(0)}° (cần song song)`}`,
      };
    }
    case "backing_corner": {
      const curbDist = scenario.curbX ? distanceToCurb(car, scenario.curbX) : 99;
      const backed = car.x > 200 && car.y < 400;
      const score = (backed ? 50 : 0) + (curbDist <= 40 ? 40 : 0) + (ctx.signalRight ? 10 : 0);
      const passed = backed && curbDist <= 45;
      return {
        passed,
        score,
        message: passed
          ? "✅ Lùi góc tốt — sát lề, kiểm soát ổn"
          : !backed
            ? "Lùi thêm quanh góc về phía trên bản đồ"
            : `Cách lề còn xa (~${Math.round(curbDist)}px) — lùi sát hơn`,
      };
    }
    case "lane_change": {
      const goalY = scenario.goalLaneY ?? 220;
      const inGoalLane = Math.abs(car.y - goalY) < 50;
      const score =
        (ctx.signalLeft ? 25 : 0) +
        (ctx.headCheckRecent ? 35 : 0) +
        (inGoalLane ? 40 : 0);
      const passed = inGoalLane && ctx.signalLeft && ctx.headCheckRecent;
      return {
        passed,
        score,
        message: passed
          ? "✅ Đổi làn đúng quy trình SMOG!"
          : !ctx.signalLeft
            ? "Chưa bật xi-nhan trái"
            : !ctx.headCheckRecent
              ? "Nhấn «Nhìn qua vai» trước khi đổi làn"
              : "Lái sang làn trên (làn nhanh nhất bên trái)",
      };
    }
    case "enter_exit_traffic": {
      const pastLine = car.x > (scenario.stopLineX ?? 380);
      const score =
        (ctx.stoppedAtLine ? 50 : 0) +
        (pastLine && Math.abs(car.speed) < 0.5 ? 30 : 0) +
        (ctx.signalLeft && pastLine ? 20 : 0);
      const passed = ctx.stoppedAtLine && pastLine && car.speed === 0;
      return {
        passed,
        score,
        message: passed
          ? "✅ STOP đúng — dừng hẳn rồi mới đi!"
          : !ctx.stoppedAtLine
            ? "Dừng hoàn toàn tại vạch STOP (speed = 0) trước khi qua"
            : !pastLine
              ? "Tiến tới vạch STOP và phanh hết"
              : "Dừng hẳn trước khi đi tiếp",
      };
    }
    case "hill_parking": {
      const correct =
        (scenario.hillMode === "down-curb" && ctx.wheelChoice === "toward-curb") ||
        (scenario.hillMode === "up-curb" && ctx.wheelChoice === "away-curb") ||
        (scenario.hillMode === "no-curb" && ctx.wheelChoice === "toward-edge");
      const score = (correct ? 60 : 0) + (ctx.handbrake ? 25 : 0) + (ctx.inPark ? 15 : 0);
      const passed = correct && ctx.handbrake && ctx.inPark;
      return {
        passed,
        score,
        message: passed
          ? "✅ Đỗ dốc đúng — bánh xe + phanh tay + số P"
          : !correct
            ? "Chọn hướng quay bánh chưa đúng"
            : !ctx.handbrake
              ? "Kéo phanh tay"
              : "Đặt số P (Park)",
      };
    }
    default:
      return { passed: false, score: 0, message: "Không rõ thao tác" };
  }
}

export function getScenario(id: string): SimScenario | undefined {
  return SIM_SCENARIOS.find((s) => s.id === id);
}
