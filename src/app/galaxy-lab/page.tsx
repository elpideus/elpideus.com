"use client";

// Temporary inspection page. Delete before committing.

import { Canvas } from "@react-three/fiber";
import * as THREE from "three";
import { useMemo } from "react";

import { GALAXY_FRAGMENT, GALAXY_VERTEX } from "@/lib/three/shaders/galaxy";
import {
  buildGalaxyField,
  galaxyDetailVector,
  galaxyExtraVector,
  galaxyFormVector,
  type GalaxyForm,
} from "@/lib/three/galaxyField";

import { filterThreeConsole } from "@/lib/three/console";

const COLS = 8;
const ROWS = 5;
const SPACING = 2.4;

function Cell({ form, x, y }: { form: GalaxyForm; x: number; y: number }) {
  const uniforms = useMemo(
    () => ({
      uColorCore: { value: form.core },
      uColorArm: { value: form.arm },
      uSquash: { value: form.squash },
      uRoll: { value: form.roll },
      uForm: { value: galaxyFormVector(form) },
      uDetail: { value: galaxyDetailVector(form) },
      uExtra: { value: galaxyExtraVector(form) },
      uOpacity: { value: form.brightness },
    }),
    [form],
  );

  return (
    <mesh position={[x, y, 0]}>
      <planeGeometry args={[2.2, 2.2]} />
      <shaderMaterial
        vertexShader={GALAXY_VERTEX}
        fragmentShader={GALAXY_FRAGMENT}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        toneMapped={false}
      />
    </mesh>
  );
}

/*
 * Before any canvas builds its store: three warns about a deprecated class that
 * @react-three/fiber constructs, and no call site here can answer for it.
 */
filterThreeConsole();

export default function GalaxyLab() {
  const forms = useMemo(() => buildGalaxyField(COLS * ROWS, [0.012, 0.22]), []);

  return (
    <div className="fixed inset-0 bg-black">
      <Canvas orthographic camera={{ zoom: 62, position: [0, 0, 10] }} gl={{ alpha: false }}>
        <color attach="background" args={["#03040a"]} />
        {forms.map((form, index) => (
          <Cell
            key={index}
            form={form}
            x={((index % COLS) - (COLS - 1) / 2) * SPACING}
            y={(Math.floor(index / COLS) - (ROWS - 1) / 2) * SPACING}
          />
        ))}
      </Canvas>
    </div>
  );
}
