"use client";

import { useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useFBO } from "@react-three/drei";
import * as THREE from "three";
import type { RefObject } from "react";
import type { CarState } from "../../lib/drive-sim/engine";
import { simToWorldAngle, simToWorldX, simToWorldZ } from "../../lib/drive-sim/coords";

export type MirrorSurfaces = {
  rear: RefObject<HTMLCanvasElement | null>;
  left: RefObject<HTMLCanvasElement | null>;
  right: RefObject<HTMLCanvasElement | null>;
};

interface Props {
  carRef: RefObject<CarState>;
  mirrors: MirrorSurfaces;
}

function renderMirrorToCanvas(
  gl: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.PerspectiveCamera,
  target: THREE.WebGLRenderTarget,
  canvas: HTMLCanvasElement,
) {
  gl.setRenderTarget(target);
  gl.render(scene, camera);
  gl.setRenderTarget(null);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const pixels = new Uint8Array(target.width * target.height * 4);
  gl.readRenderTargetPixels(target, 0, 0, target.width, target.height, pixels);

  const imageData = ctx.createImageData(target.width, target.height);
  for (let y = 0; y < target.height; y++) {
    for (let x = 0; x < target.width; x++) {
      const srcY = target.height - 1 - y;
      const srcI = (srcY * target.width + x) * 4;
      const dstI = (y * target.width + x) * 4;
      imageData.data[dstI] = pixels[srcI] ?? 0;
      imageData.data[dstI + 1] = pixels[srcI + 1] ?? 0;
      imageData.data[dstI + 2] = pixels[srcI + 2] ?? 0;
      imageData.data[dstI + 3] = 255;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

export function MirrorSystem({ carRef, mirrors }: Props) {
  const { gl, scene } = useThree();
  const rearCam = useRef(new THREE.PerspectiveCamera(70, 2, 0.1, 80));
  const leftCam = useRef(new THREE.PerspectiveCamera(55, 1.6, 0.1, 40));
  const rightCam = useRef(new THREE.PerspectiveCamera(55, 1.6, 0.1, 40));
  const rearTarget = useFBO(240, 120);
  const sideTarget = useFBO(192, 120);
  const frameSkip = useRef(0);

  useFrame(() => {
    const car = carRef.current;
    if (!car) return;

    frameSkip.current += 1;
    if (frameSkip.current % 2 !== 0) return;

    const wx = simToWorldX(car.x);
    const wz = simToWorldZ(car.y);
    const rot = simToWorldAngle(car.angle);
    const cos = Math.cos(rot);
    const sin = Math.sin(rot);

    const rear = rearCam.current;
    rear.position.set(wx - cos * 0.5, 1.15, wz - sin * 0.5);
    rear.rotation.set(-0.15, rot + Math.PI, 0);

    const left = leftCam.current;
    left.position.set(wx + sin * 0.85, 1.05, wz - cos * 0.85);
    left.rotation.set(-0.1, rot + Math.PI / 2 + 0.45, 0);

    const right = rightCam.current;
    right.position.set(wx - sin * 0.85, 1.05, wz + cos * 0.85);
    right.rotation.set(-0.1, rot - Math.PI / 2 - 0.45, 0);

    if (mirrors.rear.current) {
      renderMirrorToCanvas(gl, scene, rear, rearTarget, mirrors.rear.current);
    }
    if (mirrors.left.current) {
      renderMirrorToCanvas(gl, scene, left, sideTarget, mirrors.left.current);
    }
    if (mirrors.right.current) {
      renderMirrorToCanvas(gl, scene, right, sideTarget, mirrors.right.current);
    }
  });

  return null;
}
