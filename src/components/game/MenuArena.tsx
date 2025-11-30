'use client';

/**
 * Menu background - 3D arena with orbiting camera, archers on left/right sides
 */

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { Archer } from './Archer';

// Position archers spread apart so they appear on left/right of screen
const ARCHER_SPREAD = 50;
const CENTER_X = 0;
const LEFT_POS = { x: CENTER_X - ARCHER_SPREAD / 2, y: 0 };
const RIGHT_POS = { x: CENTER_X + ARCHER_SPREAD / 2, y: 0 };

function OrbitingCamera() {
  const timeRef = useRef(0);

  // Camera phases - faster transitions
  const CYCLE_DURATION = 24; // Full cycle in 24 seconds
  const PHASE_DURATION = 8;  // Each phase 8 seconds

  useFrame((state, delta) => {
    timeRef.current += delta;
    const cycleTime = timeRef.current % CYCLE_DURATION;
    const phase = Math.floor(cycleTime / PHASE_DURATION);
    const phaseProgress = (cycleTime % PHASE_DURATION) / PHASE_DURATION;

    let targetX: number, targetY: number, targetZ: number;
    let lookAtX: number, lookAtY: number;

    // Orbit movement within each phase
    const angle = phaseProgress * Math.PI * 0.5;

    switch (phase) {
      case 0: {
        // Wide shot - archers on far left/right edges
        targetX = CENTER_X + Math.sin(angle) * 10;
        targetZ = 55 + Math.cos(angle) * 15;
        targetY = 10 + Math.sin(angle * 0.5) * 2;
        lookAtX = CENTER_X;
        lookAtY = 1.5;
        break;
      }
      case 1: {
        // Focus on left archer - camera far to their right, archer on LEFT edge of screen
        const radius = 20;
        const orbitAngle = angle + Math.PI * 0.2;
        targetX = LEFT_POS.x + 25 + Math.sin(orbitAngle) * 8; // Far right of archer
        targetZ = 20 + Math.cos(orbitAngle) * radius;
        targetY = 4 + Math.sin(angle) * 1.5;
        lookAtX = LEFT_POS.x + 15; // Look well right of archer
        lookAtY = 1.5;
        break;
      }
      case 2: {
        // Focus on right archer - camera far to their left, archer on RIGHT edge of screen
        const radius = 20;
        const orbitAngle = angle - Math.PI * 0.2;
        targetX = RIGHT_POS.x - 25 + Math.sin(orbitAngle) * 8; // Far left of archer
        targetZ = 20 + Math.cos(orbitAngle) * radius;
        targetY = 4 + Math.sin(angle) * 1.5;
        lookAtX = RIGHT_POS.x - 15; // Look well left of archer
        lookAtY = 1.5;
        break;
      }
      default: {
        targetX = CENTER_X;
        targetZ = 55;
        targetY = 10;
        lookAtX = CENTER_X;
        lookAtY = 1.5;
      }
    }

    // Faster interpolation for snappier transitions
    const lerpFactor = 0.025;
    state.camera.position.x += (targetX - state.camera.position.x) * lerpFactor;
    state.camera.position.y += (targetY - state.camera.position.y) * lerpFactor;
    state.camera.position.z += (targetZ - state.camera.position.z) * lerpFactor;

    state.camera.lookAt(lookAtX, lookAtY, 0);
  });

  return null;
}

function MenuScene() {
  return (
    <>
      {/* Orbiting camera with offset framing */}
      <OrbitingCamera />

      {/* Bright blue sky background */}
      <color attach="background" args={['#4A90D9']} />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[CENTER_X, 50, 30]}
        intensity={1.0}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <hemisphereLight intensity={0.3} color="#87CEEB" groundColor="#4a7c4e" />

      {/* Sky */}
      <Sky
        distance={450000}
        sunPosition={[100, 50, 100]}
        inclination={0.6}
        azimuth={0.25}
        turbidity={8}
        rayleigh={0.5}
      />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[CENTER_X, -0.01, 0]} receiveShadow>
        <planeGeometry args={[1000, 500]} />
        <meshStandardMaterial color="#5a8f4e" />
      </mesh>

      {/* Left archer - positioned to appear on left side of screen */}
      <Archer
        modelId="anthropic/claude-sonnet-4"
        position={[LEFT_POS.x, LEFT_POS.y, 0]}
        side="left"
        health={2}
        isHit={false}
        isDrawing={true}
        isShooting={false}
        shotAngle={45}
      />

      {/* Right archer - positioned to appear on right side of screen */}
      <Archer
        modelId="openai/gpt-4o"
        position={[RIGHT_POS.x, RIGHT_POS.y, 0]}
        side="right"
        health={2}
        isHit={false}
        isDrawing={true}
        isShooting={false}
        shotAngle={45}
      />
    </>
  );
}

export function MenuArena() {
  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{
          position: [CENTER_X, 12, 60],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
      >
        <Suspense fallback={null}>
          <MenuScene />
        </Suspense>
      </Canvas>
    </div>
  );
}
