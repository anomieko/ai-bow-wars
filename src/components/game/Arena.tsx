'use client';

/**
 * Main 3D arena scene
 */

import { Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Sky, Grid, Text } from '@react-three/drei';
import { useGameStore } from '@/lib/game-store';
import { Archer } from './Archer';
import { Arrow } from './Arrow';

function Scene() {
  const {
    matchSetup,
    leftArcher,
    rightArcher,
    currentArrowPath,
    setCurrentArrowPath,
    phase,
    nextTurn,
  } = useGameStore();

  // Center the camera between the archers
  const centerX = matchSetup ? matchSetup.distance / 2 : 50;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[centerX, 50, 30]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />

      {/* Sky */}
      <Sky
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.5}
        azimuth={0.25}
      />

      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.01, 0]} receiveShadow>
        <planeGeometry args={[200, 50]} />
        <meshStandardMaterial color="#4a7c4e" />
      </mesh>

      {/* Grid for reference */}
      <Grid
        position={[centerX, 0, 0]}
        args={[200, 50]}
        cellSize={10}
        cellColor="#3a6c3e"
        sectionSize={50}
        sectionColor="#2a5c2e"
        fadeDistance={200}
        infiniteGrid
      />

      {/* Distance markers */}
      {matchSetup && [0, 25, 50, 75, 100, matchSetup.distance].map((dist) => (
        <Text
          key={dist}
          position={[dist, 0.1, 5]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={1}
          color="#ffffff"
          anchorX="center"
        >
          {dist}m
        </Text>
      ))}

      {/* Wind indicator */}
      {matchSetup && (
        <group position={[centerX, 8, 0]}>
          <Text
            position={[0, 1, 0]}
            fontSize={0.8}
            color="#ffffff"
            anchorX="center"
          >
            Wind: {matchSetup.wind.speed}m/s {matchSetup.wind.direction === 'left' ? '←' : '→'}
          </Text>
          {/* Wind arrow */}
          <mesh
            position={[matchSetup.wind.direction === 'left' ? -2 : 2, 0, 0]}
            rotation={[0, 0, matchSetup.wind.direction === 'left' ? Math.PI : 0]}
          >
            <coneGeometry args={[0.3, 0.8, 8]} />
            <meshStandardMaterial color="#87CEEB" />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 3, 8]} />
            <meshStandardMaterial color="#87CEEB" />
          </mesh>
        </group>
      )}

      {/* Archers */}
      {leftArcher && (
        <Archer
          modelId={leftArcher.modelId}
          position={[leftArcher.position.x, leftArcher.position.y, 0]}
          side="left"
          health={leftArcher.health}
        />
      )}
      {rightArcher && (
        <Archer
          modelId={rightArcher.modelId}
          position={[rightArcher.position.x, rightArcher.position.y, 0]}
          side="right"
          health={rightArcher.health}
        />
      )}

      {/* Arrow in flight */}
      {currentArrowPath && phase === 'shooting' && leftArcher && rightArcher && (
        <Arrow
          path={currentArrowPath}
          modelId={useGameStore.getState().currentTurn === 'left' ? leftArcher.modelId : rightArcher.modelId}
          onComplete={() => {
            setCurrentArrowPath(null);
            useGameStore.getState().setPhase('result');
            // Short delay before next turn
            setTimeout(() => {
              nextTurn();
            }, 1500);
          }}
          speed={1.5}
        />
      )}

      {/* Camera controls */}
      <OrbitControls
        target={[centerX, 2, 0]}
        minDistance={10}
        maxDistance={150}
        maxPolarAngle={Math.PI / 2 - 0.1}
      />
    </>
  );
}

export function Arena() {
  const matchSetup = useGameStore((s) => s.matchSetup);
  const centerX = matchSetup ? matchSetup.distance / 2 : 50;

  return (
    <div className="w-full h-[500px] bg-gradient-to-b from-sky-400 to-sky-200 rounded-lg overflow-hidden">
      <Canvas
        shadows
        camera={{
          position: [centerX, 15, 40],
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
