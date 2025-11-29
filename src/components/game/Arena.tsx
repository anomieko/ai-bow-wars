'use client';

/**
 * Main 3D arena scene with cinematic camera
 */

import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky, Grid, Text } from '@react-three/drei';
import { useGameStore } from '@/lib/game-store';
import { Archer } from './Archer';
import { Arrow } from './Arrow';
import { CinematicCamera } from './CinematicCamera';

function Scene() {
  const {
    matchSetup,
    leftArcher,
    rightArcher,
    currentArrowPath,
    setCurrentArrowPath,
    setCameraMode,
    phase,
    nextTurn,
    lastHitResult,
  } = useGameStore();

  // Center the camera between the archers
  const centerX = matchSetup ? matchSetup.distance / 2 : 50;

  return (
    <>
      {/* Cinematic Camera Controller */}
      <CinematicCamera />

      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[centerX, 50, 30]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <hemisphereLight intensity={0.4} color="#87CEEB" groundColor="#4a7c4e" />

      {/* Sky */}
      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.5}
        azimuth={0.25}
      />

      {/* Ground - larger and more detailed */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.01, 0]} receiveShadow>
        <planeGeometry args={[300, 100]} />
        <meshStandardMaterial color="#4a7c4e" />
      </mesh>

      {/* Grid for reference */}
      <Grid
        position={[centerX, 0.01, 0]}
        args={[300, 100]}
        cellSize={10}
        cellColor="#3a6c3e"
        sectionSize={50}
        sectionColor="#2a5c2e"
        fadeDistance={200}
        infiniteGrid
      />

      {/* Distance markers */}
      {matchSetup && [0, 25, 50, 75, 100, 125, matchSetup.distance].filter((v, i, a) => a.indexOf(v) === i).map((dist) => (
        <Text
          key={dist}
          position={[dist, 0.1, 8]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={1.5}
          color="#ffffff"
          anchorX="center"
          outlineWidth={0.1}
          outlineColor="#000000"
        >
          {dist}m
        </Text>
      ))}

      {/* Archers */}
      {leftArcher && (
        <Archer
          modelId={leftArcher.modelId}
          position={[leftArcher.position.x, leftArcher.position.y, 0]}
          side="left"
          health={leftArcher.health}
          isHit={lastHitResult?.type !== 'miss' && useGameStore.getState().currentTurn === 'right'}
          isDrawing={phase === 'thinking' && useGameStore.getState().currentTurn === 'left'}
          isShooting={phase === 'shooting' && useGameStore.getState().currentTurn === 'left'}
        />
      )}
      {rightArcher && (
        <Archer
          modelId={rightArcher.modelId}
          position={[rightArcher.position.x, rightArcher.position.y, 0]}
          side="right"
          health={rightArcher.health}
          isHit={lastHitResult?.type !== 'miss' && useGameStore.getState().currentTurn === 'left'}
          isDrawing={phase === 'thinking' && useGameStore.getState().currentTurn === 'right'}
          isShooting={phase === 'shooting' && useGameStore.getState().currentTurn === 'right'}
        />
      )}

      {/* Arrow in flight */}
      {currentArrowPath && phase === 'shooting' && leftArcher && rightArcher && (
        <Arrow
          path={currentArrowPath}
          modelId={useGameStore.getState().currentTurn === 'left' ? leftArcher.modelId : rightArcher.modelId}
          onComplete={() => {
            setCurrentArrowPath(null);
            setCameraMode('result');
            useGameStore.getState().setPhase('result');
            // Longer delay to show the result before next turn
            setTimeout(() => {
              nextTurn();
            }, 3500);
          }}
          speed={1.0}
        />
      )}
    </>
  );
}

export function Arena() {
  const matchSetup = useGameStore((s) => s.matchSetup);
  const centerX = matchSetup ? matchSetup.distance / 2 : 50;

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        camera={{
          position: [centerX, 20, 60],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
      >
        <Suspense fallback={null}>
          <Scene />
        </Suspense>
      </Canvas>
    </div>
  );
}
