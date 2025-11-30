'use client';

/**
 * Giant decorative arrows falling from the sky during intro scene
 * Purely visual - no game state involvement
 */

import { useRef, useMemo, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGameStore } from '@/lib/game-store';
import * as THREE from 'three';

const ARROW_COUNT = 25;
const FALL_DURATION = 1.3; // seconds per arrow fall

interface FallingArrowConfig {
  x: number;
  z: number;
  delay: number;
  scale: number;
  rotationOffset: number;
}

function FallingArrow({ config, startTime }: { config: FallingArrowConfig; startTime: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const stuckRef = useRef(false);
  const stuckYRef = useRef(0);

  useFrame((state) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime - startTime;
    const adjustedTime = time - config.delay;

    if (adjustedTime < 0) {
      groupRef.current.visible = false;
      return;
    }

    // If already stuck, stay at ground level
    if (stuckRef.current) {
      groupRef.current.visible = true;
      groupRef.current.position.y = stuckYRef.current;
      return;
    }

    // Fall from sky to ground with acceleration
    const startY = 30;
    const groundY = 0.5; // Stick slightly above ground
    const gravity = 40;
    const y = startY - 0.5 * gravity * adjustedTime * adjustedTime;

    // Hit the ground - stick there
    if (y <= groundY) {
      stuckRef.current = true;
      stuckYRef.current = groundY;
      groupRef.current.visible = true;
      groupRef.current.position.y = groundY;
      // Final rotation - slight random tilt when stuck
      groupRef.current.rotation.z = -Math.PI / 2 + (config.rotationOffset % 0.3) - 0.15;
      return;
    }

    groupRef.current.visible = true;
    groupRef.current.position.y = y;

    // Wobble while falling
    const wobble = Math.sin(adjustedTime * 8 + config.rotationOffset) * 0.1;
    groupRef.current.rotation.z = -Math.PI / 2 + wobble;
  });

  return (
    <group ref={groupRef} position={[config.x, 30, config.z]} rotation={[0, 0, -Math.PI / 2]} visible={false}>
      <group scale={config.scale}>
        {/* Arrow shaft - wooden brown */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.25, 0.25, 6, 8]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
        {/* Arrow head - metallic gray, pointing down */}
        <mesh position={[3.5, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.5, 1.2, 8]} />
          <meshStandardMaterial color="#505050" metalness={0.7} roughness={0.3} />
        </mesh>
        {/* Arrow fletching - red feathers */}
        <mesh position={[-2.8, 0, 0]} rotation={[0, 0, -Math.PI / 2]}>
          <coneGeometry args={[0.4, 1.0, 4]} />
          <meshStandardMaterial color="#cc2222" />
        </mesh>
      </group>
    </group>
  );
}

function ArrowsContainer({ centerX }: { centerX: number }) {
  const startTimeRef = useRef<number | null>(null);
  const [ready, setReady] = useState(false);

  // Generate falling arrow configs spread across the visible area
  const arrows = useMemo<FallingArrowConfig[]>(() => {
    return Array.from({ length: ARROW_COUNT }, (_, i) => {
      // Spread arrows across x: wide range
      // Spread across z: mostly far back (5-25), some closer
      const xSpread = 120;
      const x = centerX - xSpread / 2 + (i % 8) * (xSpread / 7);
      const z = 5 + (i % 5) * 5; // Range from 5 to 25 (further back)

      return {
        x,
        z,
        delay: i * 0.08, // Staggered faster
        scale: 0.15 + (i % 4) * 0.05, // Much smaller: 0.15 to 0.3
        rotationOffset: i * 0.7,
      };
    });
  }, [centerX]);

  // Capture start time on first frame
  useFrame((state) => {
    if (startTimeRef.current === null) {
      startTimeRef.current = state.clock.elapsedTime;
      setReady(true);
    }
  });

  if (!ready) return null;

  return (
    <group>
      {arrows.map((config, i) => (
        <FallingArrow key={i} config={config} startTime={startTimeRef.current!} />
      ))}
    </group>
  );
}

export function IntroArrows() {
  const { matchSetup, cameraMode, phase } = useGameStore();

  const isVisible = cameraMode === 'intro' && phase === 'ready';
  const centerX = matchSetup ? matchSetup.distance / 2 : 50;

  if (!isVisible) return null;

  // Key forces remount when visibility changes, resetting startTime
  return <ArrowsContainer key={isVisible ? 'visible' : 'hidden'} centerX={centerX} />;
}
