'use client';

/**
 * Main 3D arena scene with cinematic camera
 */

import { Suspense, useState, useEffect, useRef, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import { useGameStore } from '@/lib/game-store';
import { Archer } from './Archer';
import { Arrow } from './Arrow';
import { StuckArrow } from './StuckArrow';
import { CinematicCamera } from './CinematicCamera';
import { IntroTitle3D } from './IntroTitle3D';
import { IntroArrows } from './IntroArrows';
import { StuckArrow as StuckArrowType } from '@/types/game';
import { getRandomQuoteExcluding } from '@/config/ai-quotes';
import { usePauseableTimeout } from '@/lib/use-pause';

// Recovery timeout for stuck states (ms)
const STUCK_RECOVERY_TIMEOUT = 5000;

// Speech bubble state managed outside R3F for proper React state
interface SpeechBubbleState {
  side: 'left' | 'right' | null;
  message: string;
}

function Scene({ speechBubble }: { speechBubble: SpeechBubbleState }) {
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
    turns,
    currentTurn,
    stuckArrows,
    addStuckArrow,
  } = useGameStore();

  // Get the shot angle for the current archer (from the most recent turn)
  const getArcherShotAngle = (side: 'left' | 'right'): number => {
    if (side !== currentTurn) return 45; // Default for non-active archer
    // Get the last turn for this side's archer
    const archerModelId = side === 'left' ? leftArcher?.modelId : rightArcher?.modelId;
    const lastTurn = [...turns].reverse().find(t => t.modelId === archerModelId);
    return lastTurn?.shot.angle ?? 45;
  };

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

      {/* Sky - bright sunny day */}
      <Sky
        distance={450000}
        sunPosition={[100, 50, 100]}
        inclination={0.6}
        azimuth={0.25}
        turbidity={8}
        rayleigh={0.5}
      />

      {/* Ground - expansive grass field */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[centerX, -0.01, 0]} receiveShadow>
        <planeGeometry args={[1000, 500]} />
        <meshStandardMaterial color="#5a8f4e" />
      </mesh>

      {/* Archers */}
      {leftArcher && (
        <Archer
          modelId={leftArcher.modelId}
          position={[leftArcher.position.x, leftArcher.position.y, 0]}
          side="left"
          health={leftArcher.health}
          isHit={phase === 'result' && lastHitResult?.type !== 'miss' && currentTurn === 'right'}
          isDrawing={phase === 'thinking' && currentTurn === 'left'}
          isShooting={phase === 'shooting' && currentTurn === 'left'}
          shotAngle={getArcherShotAngle('left')}
          speechBubble={speechBubble.side === 'left' ? speechBubble.message : null}
        />
      )}
      {rightArcher && (
        <Archer
          modelId={rightArcher.modelId}
          position={[rightArcher.position.x, rightArcher.position.y, 0]}
          side="right"
          health={rightArcher.health}
          isHit={phase === 'result' && lastHitResult?.type !== 'miss' && currentTurn === 'left'}
          isDrawing={phase === 'thinking' && currentTurn === 'right'}
          isShooting={phase === 'shooting' && currentTurn === 'right'}
          shotAngle={getArcherShotAngle('right')}
          speechBubble={speechBubble.side === 'right' ? speechBubble.message : null}
        />
      )}

      {/* Stuck arrows from previous shots */}
      {stuckArrows.map((arrow) => (
        <StuckArrow key={arrow.id} arrow={arrow} />
      ))}

      {/* 3D Intro Title */}
      <IntroTitle3D />

      {/* Decorative arrows during intro */}
      <IntroArrows />

      {/* Arrow in flight */}
      {currentArrowPath && phase === 'shooting' && leftArcher && rightArcher && (
        <Arrow
          path={currentArrowPath}
          modelId={useGameStore.getState().currentTurn === 'left' ? leftArcher.modelId : rightArcher.modelId}
          onComplete={() => {
            // Safety check: only proceed if still in shooting phase
            const currentPhase = useGameStore.getState().phase;
            if (currentPhase !== 'shooting') {
              console.warn('[Arena] Arrow completed but phase is', currentPhase, '- skipping transition');
              return;
            }

            // Get the current state to create stuck arrow
            const state = useGameStore.getState();
            const path = state.currentArrowPath;
            const result = state.lastHitResult;
            const shooterModelId = state.currentTurn === 'left' ? leftArcher.modelId : rightArcher.modelId;
            const targetSide = state.currentTurn === 'left' ? 'right' : 'left';
            const targetArcher = targetSide === 'left' ? leftArcher : rightArcher;

            if (path && path.length >= 2) {
              const finalPos = path[path.length - 1];
              const prevPos = path[path.length - 2];
              const angle = Math.atan2(finalPos.y - prevPos.y, finalPos.x - prevPos.x);

              // Determine where arrow stuck
              let stuckIn: 'ground' | 'body' | 'head' = 'ground';
              let stuckPos = { ...finalPos };

              if (result?.type === 'headshot') {
                stuckIn = 'head';
                // Position at head height
                stuckPos = { x: targetArcher.position.x, y: targetArcher.position.y + 2.0 };
              } else if (result?.type === 'body') {
                stuckIn = 'body';
                // Position at body
                stuckPos = { x: targetArcher.position.x, y: targetArcher.position.y + 1.0 };
              }

              const stuckArrow: StuckArrowType = {
                id: `arrow-${Date.now()}-${Math.random()}`,
                position: stuckPos,
                angle: stuckIn === 'ground' ? angle : (targetSide === 'left' ? 0 : Math.PI),
                modelId: shooterModelId,
                stuckIn,
                targetSide: stuckIn !== 'ground' ? targetSide : undefined,
              };

              addStuckArrow(stuckArrow);
            }

            setCurrentArrowPath(null);
            setCameraMode('result');
            useGameStore.getState().setPhase('result');
            // Note: nextTurn() is called via usePauseableTimeout in Arena component
            // This ensures it pauses properly when alt-tabbing
          }}
          speed={1.0}
        />
      )}
    </>
  );
}

export function Arena() {
  const matchSetup = useGameStore((s) => s.matchSetup);
  const phase = useGameStore((s) => s.phase);
  const currentTurn = useGameStore((s) => s.currentTurn);
  const nextTurn = useGameStore((s) => s.nextTurn);
  const centerX = matchSetup ? matchSetup.distance / 2 : 50;

  // Speech bubble state - shows during shooting phase for the shooting archer
  const [speechBubble, setSpeechBubble] = useState<SpeechBubbleState>({ side: null, message: '' });
  const recentQuotesRef = useRef<string[]>([]);
  const lastShootingTurn = useRef<string | null>(null);

  // Track when we entered thinking phase for stuck detection
  const thinkingStartRef = useRef<number | null>(null);

  // WebGL context loss handler
  const handleContextLoss = useCallback((event: Event) => {
    event.preventDefault(); // Allows context restore attempt
    console.warn('[Arena] WebGL context lost! Will attempt recovery...');
  }, []);

  const handleContextRestored = useCallback(() => {
    console.log('[Arena] WebGL context restored');
    // Check if we're stuck and need recovery
    const state = useGameStore.getState();
    if (state.phase === 'thinking' && state.screen === 'game') {
      console.log('[Arena] Context restored during thinking phase - game should auto-recover via GameLoop');
    }
  }, []);

  // Visibility change recovery - when tab becomes visible, check for stuck state
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const state = useGameStore.getState();

        // If we're in thinking phase and have been for a while, the game might be stuck
        if (state.phase === 'thinking' && state.screen === 'game' && thinkingStartRef.current) {
          const stuckDuration = Date.now() - thinkingStartRef.current;

          if (stuckDuration > STUCK_RECOVERY_TIMEOUT) {
            console.warn('[Arena] Tab became visible - detected potentially stuck thinking phase (' +
              Math.round(stuckDuration / 1000) + 's). Watchdog should handle this.');
            // Note: We don't force cancel here - let the GameLoop watchdog handle it
            // This just logs for debugging. The watchdog in GameLoop.tsx will fire.
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Track when thinking phase starts (for stuck detection)
  useEffect(() => {
    if (phase === 'thinking') {
      thinkingStartRef.current = Date.now();
    } else {
      thinkingStartRef.current = null;
    }
  }, [phase]);

  // Pauseable timer for result display - triggers nextTurn after 3.5s
  usePauseableTimeout(
    () => {
      nextTurn();
    },
    phase === 'result' ? 3500 : null,
    [nextTurn]
  );

  // Show speech bubble during thinking phase (when camera focuses on archer)
  useEffect(() => {
    if (phase === 'thinking' && currentTurn) {
      // Only set new quote when a new thinking phase starts
      if (lastShootingTurn.current !== currentTurn) {
        lastShootingTurn.current = currentTurn;

        // Get a quote (avoiding recent ones)
        const message = getRandomQuoteExcluding(recentQuotesRef.current, 15);
        recentQuotesRef.current.push(message);
        if (recentQuotesRef.current.length > 30) {
          recentQuotesRef.current.shift();
        }

        setSpeechBubble({ side: currentTurn, message });
      }
    } else if (phase !== 'thinking') {
      // Clear bubble when not in thinking phase
      setSpeechBubble({ side: null, message: '' });
      lastShootingTurn.current = null;
    }
  }, [phase, currentTurn]);

  return (
    <div className="w-full h-full">
      <Canvas
        shadows
        frameloop="always"
        camera={{
          position: [centerX, 20, 60],
          fov: 50,
          near: 0.1,
          far: 1000,
        }}
        onCreated={({ gl }) => {
          // Attach WebGL context loss/restore handlers
          const canvas = gl.domElement;
          canvas.addEventListener('webglcontextlost', handleContextLoss);
          canvas.addEventListener('webglcontextrestored', handleContextRestored);
        }}
      >
        <Suspense fallback={null}>
          <Scene speechBubble={speechBubble} />
        </Suspense>
      </Canvas>
    </div>
  );
}
