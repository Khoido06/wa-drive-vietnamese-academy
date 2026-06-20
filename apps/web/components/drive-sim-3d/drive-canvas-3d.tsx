"use client";

import { Suspense } from "react";
import type { RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky, Environment } from "@react-three/drei";
import type { CarState } from "../../lib/drive-sim/engine";
import type { SimScenario } from "../../lib/drive-sim/scenarios";
import { CarModel } from "./car-model";
import { ChaseCamera } from "./chase-camera";
import { ScenarioWorld } from "./scenario-world";

interface Props {
  carRef: RefObject<CarState>;
  scenario: SimScenario;
  signalLeft: boolean;
  signalRight: boolean;
  steer: number;
}

function Scene(props: Props) {
  return (
    <>
      <Sky sunPosition={[80, 40, 60]} turbidity={6} rayleigh={0.4} />
      <fog attach="fog" args={["#c4b5a8", 35, 90]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        position={[20, 30, 15]}
        intensity={1.4}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={80}
        shadow-camera-left={-30}
        shadow-camera-right={30}
        shadow-camera-top={30}
        shadow-camera-bottom={-30}
      />
      <Environment preset="city" />
      <ScenarioWorld scenario={props.scenario} />
      <CarModel
        carRef={props.carRef}
        signalLeft={props.signalLeft}
        signalRight={props.signalRight}
        steer={props.steer}
      />
      <ChaseCamera carRef={props.carRef} />
    </>
  );
}

export function DriveCanvas3D(props: Props) {
  return (
    <div className="drive-sim__viewport drive-sim__viewport--3d">
      <Canvas
        shadows
        dpr={[1, 1.75]}
        camera={{ fov: 55, near: 0.1, far: 200, position: [0, 8, 12] }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
      <div className="drive-sim__3d-badge">3D</div>
    </div>
  );
}
