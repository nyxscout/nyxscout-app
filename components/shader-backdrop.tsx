"use client";

import { ShaderGradient, ShaderGradientCanvas } from "@shadergradient/react";

export function ShaderBackdrop() {
  return (
    <ShaderGradientCanvas
      className="shader-backdrop"
      pixelDensity={1.15}
      fov={42}
      pointerEvents="none"
      powerPreference="high-performance"
    >
      <ShaderGradient
        control="props"
        type="plane"
        animate="on"
        uSpeed={0.18}
        uStrength={2.4}
        uDensity={1.15}
        uFrequency={4.8}
        uAmplitude={2.3}
        color1="#1017a8"
        color2="#7c3aed"
        color3="#0fd3b8"
        brightness={1.25}
        reflection={0.12}
        grain="on"
        grainBlending={0.18}
        lightType="3d"
        envPreset="city"
        cDistance={4.2}
        cPolarAngle={92}
        cAzimuthAngle={165}
        positionX={0.64}
        positionY={-0.16}
        positionZ={0}
        rotationX={0}
        rotationY={8}
        rotationZ={-8}
        shader="defaults"
        wireframe={false}
      />
    </ShaderGradientCanvas>
  );
}
