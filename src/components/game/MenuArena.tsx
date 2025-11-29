'use client';

/**
 * Menu background - 3D arena with orbiting camera for main menu
 */

import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { Archer } from './Archer';
import * as THREE from 'three';

// Demo archers for menu display
const DEMO_DISTANCE = 100;
const LEFT_POS = { x: 0, y: 0 };
const RIGHT_POS = { x: DEMO_DISTANCE, y: 0 };

function OrbitingCamera() {
  const timeRef = useRef(0);
  const centerX = DEMO_DISTANCE / 2;

  // Camera sequence phases (slower timing):
  // 0-20s: Wide overview orbit
  // 20-40s: Orbit around left archer (Claude)
  // 40-60s: Orbit around right archer (GPT-4o)
  // 60-80s: Back to wide overview
  // Then repeat
  const CYCLE_DURATION = 80;
  const PHASE_DURATION = 20;

  useFrame((state, delta) => {
    timeRef.current += delta;
    const cycleTime = timeRef.current % CYCLE_DURATION;
    const phase = Math.floor(cycleTime / PHASE_DURATION);
    const phaseProgress = (cycleTime % PHASE_DURATION) / PHASE_DURATION;

    let targetX: number, targetY: number, targetZ: number;
    let lookAtX: number, lookAtY: number;

    // Slow partial rotation (quarter turn per phase instead of full)
    const angle = phaseProgress * Math.PI * 0.5;

    switch (phase) {
      case 0: // Wide overview - orbit around center
      case 3: {
        const radius = 100;
        targetX = centerX + Math.sin(angle) * radius;
        targetZ = Math.cos(angle) * radius;
        targetY = 25 + Math.sin(angle * 0.5) * 5;
        lookAtX = centerX;
        lookAtY = 3;
        break;
      }
      case 1: { // Orbit around left archer (Claude)
        const radius = 20;
        targetX = LEFT_POS.x + Math.sin(angle + Math.PI * 0.25) * radius;
        targetZ = Math.cos(angle + Math.PI * 0.25) * radius;
        targetY = 6 + Math.sin(angle) * 2;
        lookAtX = LEFT_POS.x;
        lookAtY = 1.5;
        break;
      }
      case 2: { // Orbit around right archer (GPT-4o)
        const radius = 20;
        targetX = RIGHT_POS.x + Math.sin(angle + Math.PI * 0.25) * radius;
        targetZ = Math.cos(angle + Math.PI * 0.25) * radius;
        targetY = 6 + Math.sin(angle) * 2;
        lookAtX = RIGHT_POS.x;
        lookAtY = 1.5;
        break;
      }
      default: {
        targetX = centerX;
        targetZ = 100;
        targetY = 25;
        lookAtX = centerX;
        lookAtY = 3;
      }
    }

    // Smooth interpolation for camera movement
    const lerpFactor = 0.015;
    state.camera.position.x += (targetX - state.camera.position.x) * lerpFactor;
    state.camera.position.y += (targetY - state.camera.position.y) * lerpFactor;
    state.camera.position.z += (targetZ - state.camera.position.z) * lerpFactor;

    state.camera.lookAt(lookAtX, lookAtY, 0);
  });

  return null;
}

function MenuScene() {
  const centerX = DEMO_DISTANCE / 2;

  return (
    <>
      {/* Orbiting Camera */}
      <OrbitingCamera />

      {/* Bright blue sky background */}
      <color attach="background" args={['#4A90D9']} />

      {/* Lighting - reduced intensity */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[centerX, 50, 30]}
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.01, 0]} receiveShadow>
        <planeGeometry args={[1000, 500]} />
        <meshStandardMaterial color="#5a8f4e" />
      </mesh>

      {/* Demo archers - using first two model configs */}
      <Archer
        modelId="anthropic/claude-sonnet-4"
        position={[LEFT_POS.x, LEFT_POS.y, 0]}
        side="left"
        health={2}
        isHit={false}
        isDrawing={false}
        isShooting={false}
        shotAngle={45}
      />
      <Archer
        modelId="openai/gpt-4o"
        position={[RIGHT_POS.x, RIGHT_POS.y, 0]}
        side="right"
        health={2}
        isHit={false}
        isDrawing={false}
        isShooting={false}
        shotAngle={45}
      />
    </>
  );
}

export function MenuArena() {
  const centerX = DEMO_DISTANCE / 2;

  return (
    <div className="absolute inset-0">
      <Canvas
        shadows
        camera={{
          position: [centerX, 25, 80],
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
