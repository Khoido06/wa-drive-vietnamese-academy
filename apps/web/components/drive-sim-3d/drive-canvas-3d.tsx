"use client";

import { Suspense } from "react";
import type { RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { Sky, Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import type { CarState } from "../../lib/drive-sim/engine";
import type { SimScenario } from "../../lib/drive-sim/scenarios";
import { CarModel } from "./car-model";
import { ChaseCamera } from "./chase-camera";
import { ScenarioWorld } from "./scenario-world";
import { MirrorSystem, type MirrorSurfaces } from "./mirror-system";
import { CockpitCamera, CockpitInterior } from "./cockpit-camera";
import { BlindSpotTraffic } from "./blind-spot-traffic";

export type CameraMode = "cockpit" | "chase";

interface Props {
  carRef: RefObject<CarState>;
  scenario: SimScenario;
  signalLeft: boolean;
  signalRight: boolean;
  steer: number;
  cameraMode: CameraMode;
  mirrors: MirrorSurfaces;
}

function Scene(props: Props) {
  const cockpit = props.cameraMode === "cockpit";

  return (
    <>
      <Sky sunPosition={[80, 40, 60]} turbidity={4} rayleigh={0.5} mieCoefficient={0.005} />
      <fog attach="fog" args={["#b8c4d0", 40, 100]} />
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
      <Environment preset="city" />
      <ScenarioWorld scenario={props.scenario} />
      <BlindSpotTraffic scenario={props.scenario} />
      <CarModel
        carRef={props.carRef}
        signalLeft={props.signalLeft}
        signalRight={props.signalRight}
        steer={props.steer}
        hideInCockpit={cockpit}
      />
      <CockpitInterior carRef={props.carRef} visible={cockpit} />
      <MirrorSystem carRef={props.carRef} mirrors={props.mirrors} />
      <ChaseCamera carRef={props.carRef} active={!cockpit} />
      <CockpitCamera carRef={props.carRef} active={cockpit} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={0.25} luminanceThreshold={0.85} luminanceSmoothing={0.9} />
        <Vignette eskil={false} offset={0.15} darkness={0.45} />
      </EffectComposer>
    </>
  );
}

export function DriveCanvas3D(props: Props) {
  return (
    <div className={`drive-sim__viewport drive-sim__viewport--3d${props.cameraMode === "cockpit" ? " drive-sim__viewport--cockpit" : ""}`}>
      <Canvas
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: props.cameraMode === "cockpit" ? 68 : 52, near: 0.1, far: 200, position: [0, 8, 12] }}
        gl={{ antialias: true, powerPreference: "high-performance", alpha: false }}
      >
        <Suspense fallback={null}>
          <Scene {...props} />
        </Suspense>
      </Canvas>
      <div className="drive-sim__3d-badge">{props.cameraMode === "cockpit" ? "COCKPIT" : "3D"}</div>
    </div>
  );
}
