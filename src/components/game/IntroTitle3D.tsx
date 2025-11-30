'use client';

/**
 * Epic 3D intro title that renders in the Three.js scene
 * Shows "MODEL vs MODEL" with thick 3D text and subtle animation
 */

import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text3D, Center, Float } from '@react-three/drei';
import { useGameStore } from '@/lib/game-store';
import { getModelConfig } from '@/config/models';
import * as THREE from 'three';

// Font path - loaded from public folder
const FONT_URL = '/fonts/helvetiker_bold.typeface.json';

interface ModelTextProps {
  name: string;
  color: string;
  position: [number, number, number];
  side: 'left' | 'right';
}

function ModelText({ name, color, position }: ModelTextProps) {
  // Split into multiple lines if name is long
  const maxCharsPerLine = 10;
  const words = name.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= maxCharsPerLine) {
      currentLine = currentLine ? `${currentLine} ${word}` : word;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);

  // If single word is too long, just use it as-is
  if (lines.length === 0) lines.push(name);

  // Scale based on longest line
  const maxLineLength = Math.max(...lines.map(l => l.length));
  const scale = maxLineLength > 12 ? 0.7 : maxLineLength > 10 ? 0.85 : 1;

  const lineHeight = 3.2;

  return (
    <Float
      speed={1.5}
      rotationIntensity={0.1}
      floatIntensity={0.3}
      floatingRange={[-0.1, 0.1]}
    >
      <group position={position} scale={scale}>
        {lines.map((line, idx) => (
          <group key={idx} position={[0, -idx * lineHeight, 0]}>
            <Center>
              <Text3D
                font={FONT_URL}
                size={2.5}
                height={0.6}
                curveSegments={12}
                bevelEnabled
                bevelThickness={0.08}
                bevelSize={0.04}
                bevelOffset={0}
                bevelSegments={5}
              >
                {line}
                <meshStandardMaterial
                  color={color}
                  metalness={0.3}
                  roughness={0.4}
                  emissive={color}
                  emissiveIntensity={0.2}
                />
              </Text3D>
            </Center>
          </group>
        ))}
      </group>
    </Float>
  );
}

function VSText({ position }: { position: [number, number, number] }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const timeRef = useRef(0);

  // Pulsing glow effect
  useFrame((_, delta) => {
    timeRef.current += delta;
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.emissiveIntensity = 0.3 + Math.sin(timeRef.current * 3) * 0.15;
    }
  });

  return (
    <Float
      speed={2}
      rotationIntensity={0.15}
      floatIntensity={0.4}
      floatingRange={[-0.15, 0.15]}
    >
      <group position={position}>
        <Center>
          <Text3D
            ref={meshRef}
            font={FONT_URL}
            size={2}
            height={0.6}
            curveSegments={12}
            bevelEnabled
            bevelThickness={0.08}
            bevelSize={0.04}
            bevelOffset={0}
            bevelSegments={5}
          >
            VS
            <meshStandardMaterial
              color="#1a1a1a"
              metalness={0.3}
              roughness={0.5}
            />
          </Text3D>
        </Center>
      </group>
    </Float>
  );
}

export function IntroTitle3D() {
  const { matchSetup, leftArcher, rightArcher, cameraMode, phase } = useGameStore();
  const groupRef = useRef<THREE.Group>(null);

  const leftConfig = leftArcher ? getModelConfig(leftArcher.modelId) : null;
  const rightConfig = rightArcher ? getModelConfig(rightArcher.modelId) : null;

  // Only show during intro
  const isVisible = cameraMode === 'intro' && phase === 'ready';

  // Calculate center position based on arena
  const centerX = matchSetup ? matchSetup.distance / 2 : 50;

  // Animate the whole group slightly
  useFrame((state) => {
    if (groupRef.current && isVisible) {
      groupRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.5) * 0.02;
    }
  });

  if (!isVisible || !leftConfig || !rightConfig || !matchSetup) {
    return null;
  }

  return (
    <group ref={groupRef} position={[centerX, 8, 20]}>
      {/* Extra lighting for the text */}
      <pointLight position={[0, 5, 10]} intensity={50} color="#ffffff" />
      <pointLight position={[-15, 0, 5]} intensity={30} color={leftConfig.color} />
      <pointLight position={[15, 0, 5]} intensity={30} color={rightConfig.color} />

      {/* Left model name - higher */}
      <ModelText
        name={leftConfig.name}
        color={leftConfig.color}
        position={[-14, 1, 0]}
        side="left"
      />

      {/* VS in the middle */}
      <VSText position={[0, -1, 0]} />

      {/* Right model name - lower */}
      <ModelText
        name={rightConfig.name}
        color={rightConfig.color}
        position={[14, -3, 0]}
        side="right"
      />
    </group>
  );
}
