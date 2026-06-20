"use client";

import { Suspense } from "react";
import type { RefObject } from "react";
import { Canvas } from "@react-three/fiber";
import { Environment } from "@react-three/drei";
import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";
import type { CarState } from "../../lib/drive-sim/engine";
import type { SimScenario } from "../../lib/drive-sim/scenarios";
import { CarModel } from "./car-model";
import { ChaseCamera } from "./chase-camera";
import { ScenarioWorld } from "./scenario-world";
import { MirrorSystem, type MirrorSurfaces } from "./mirror-system";
import { CockpitCamera, CockpitInterior } from "./cockpit-camera";
import { AiTraffic } from "./ai-traffic";
import { WeatherScene, type WeatherMode } from "./weather-scene";

export type CameraMode = "cockpit" | "chase";

interface Props {
  carRef: RefObject<CarState>;
  scenario: SimScenario;
  signalLeft: boolean;
  signalRight: boolean;
  steer: number;
  cameraMode: CameraMode;
  mirrors: MirrorSurfaces;
  weather: WeatherMode;
  trafficRef: RefObject<import("../../lib/drive-sim/traffic").AiVehicle[]>;
  trafficIds: string[];
}

function Scene(props: Props) {
  const cockpit = props.cameraMode === "cockpit";
  const night = props.weather === "night" || props.weather === "rain";

  return (
    <>
      <WeatherScene mode={props.weather} />
      {props.weather === "day" ? <Environment preset="city" /> : null}
      <ScenarioWorld scenario={props.scenario} dimmed={night} />
      <AiTraffic trafficRef={props.trafficRef} vehicleIds={props.trafficIds} headlights={night} />
      <CarModel
        carRef={props.carRef}
        signalLeft={props.signalLeft}
        signalRight={props.signalRight}
        steer={props.steer}
        hideInCockpit={cockpit}
        headlights={night}
      />
      <CockpitInterior carRef={props.carRef} visible={cockpit} />
      <MirrorSystem carRef={props.carRef} mirrors={props.mirrors} />
      <ChaseCamera carRef={props.carRef} active={!cockpit} />
      <CockpitCamera carRef={props.carRef} active={cockpit} />
      <EffectComposer multisampling={0}>
        <Bloom intensity={night ? 0.45 : 0.25} luminanceThreshold={0.75} luminanceSmoothing={0.9} />
        <Vignette eskil={false} offset={0.15} darkness={night ? 0.65 : 0.45} />
      </EffectComposer>
    </>
  );
}

export function DriveCanvas3D(props: Props) {
  return (
    <div className={`drive-sim__viewport drive-sim__viewport--3d${props.cameraMode === "cockpit" ? " drive-sim__viewport--cockpit" : ""}${props.weather !== "day" ? ` drive-sim__viewport--${props.weather}` : ""}`}>
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
      <div className="drive-sim__3d-badge">
        {props.weather === "rain" ? "🌧️" : props.weather === "night" ? "🌙" : "☀️"}{" "}
        {props.cameraMode === "cockpit" ? "COCKPIT" : "3D"}
      </div>
    </div>
  );
}

export type { WeatherMode };
