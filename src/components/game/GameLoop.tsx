'use client';

/**
 * Game loop component - handles AI turns and game progression
 */

import { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@/lib/game-store';
import { useDebugStore } from '@/lib/debug-store';
import { simulateArrow } from '@/lib/physics';
import { Shot } from '@/types/game';

// Timeout for AI API calls (10 seconds)
const AI_TIMEOUT_MS = 10000;

export function GameLoop() {
  const {
    phase,
    matchSetup,
    leftArcher,
    rightArcher,
    currentTurn,
    turnNumber,
    turns,
    setPhase,
    executeShot,
    setCurrentArrowPath,
    setThinkingModelId,
    setCameraMode,
    startMatch,
    cameraMode,
  } = useGameStore();

  // Debug store for test mode cheats
  const getDebugHitResult = useDebugStore((s) => s.getDebugHitResult);

  // AbortController to cancel in-flight requests when component unmounts (user clicks Menu)
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: abort any in-flight requests when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
    };
  }, []);

  const executeAITurn = useCallback(async () => {
    if (!matchSetup || !leftArcher || !rightArcher) return;

    const currentArcher = currentTurn === 'left' ? leftArcher : rightArcher;
    const targetArcher = currentTurn === 'left' ? rightArcher : leftArcher;

    setThinkingModelId(currentArcher.modelId);

    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Set up timeout
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, AI_TIMEOUT_MS);

    try {
      // Call the AI API with abort signal
      const response = await fetch('/api/shoot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: currentArcher.modelId,
          archer: currentArcher,
          opponent: targetArcher,
          wind: matchSetup.wind,
          distance: matchSetup.distance,
          turns,
          turnNumber,
        }),
        signal,
      });

      clearTimeout(timeoutId);

      // Check if we were aborted (user clicked Menu)
      if (signal.aborted) {
        console.log('AI request aborted (match cancelled)');
        return;
      }

      const data = await response.json();

      if (!data.success) {
        console.error('AI error:', data.error);
        // Use fallback shot
        data.shot = { angle: 45, power: 70, reasoning: 'Fallback shot' };
      }

      const shot: Shot = {
        angle: data.shot.angle,
        power: data.shot.power,
        reasoning: data.shot.reasoning,
      };

      // Simulate the arrow
      const simulation = simulateArrow(
        currentArcher.position,
        shot.angle,
        shot.power,
        matchSetup.wind,
        targetArcher
      );

      // Apply debug overrides if in mock mode (only affects hit result, not path)
      const finalHitResult = getDebugHitResult(currentTurn, simulation.hitResult);

      // Set camera to follow the arrow
      setCameraMode('follow-arrow');

      // Set arrow path for animation
      setCurrentArrowPath(simulation.path);
      setPhase('shooting');

      // Execute the shot (update game state)
      executeShot(shot, simulation.path, finalHitResult);
    } catch (error) {
      clearTimeout(timeoutId);

      // Don't process errors if aborted (user cancelled match)
      if (signal.aborted) {
        console.log('AI request aborted (match cancelled or timeout)');
        return;
      }

      console.error('Failed to execute AI turn:', error);
      // Fallback shot on error
      const fallbackShot: Shot = { angle: 45, power: 70, reasoning: 'Error fallback' };
      const simulation = simulateArrow(
        currentArcher.position,
        fallbackShot.angle,
        fallbackShot.power,
        matchSetup.wind,
        targetArcher
      );
      const finalHitResult = getDebugHitResult(currentTurn, simulation.hitResult);
      setCameraMode('follow-arrow');
      setCurrentArrowPath(simulation.path);
      setPhase('shooting');
      executeShot(fallbackShot, simulation.path, finalHitResult);
    } finally {
      setThinkingModelId(null);
    }
  }, [
    matchSetup,
    leftArcher,
    rightArcher,
    currentTurn,
    turnNumber,
    turns,
    setPhase,
    executeShot,
    setCurrentArrowPath,
    setThinkingModelId,
    setCameraMode,
    getDebugHitResult,
  ]);

  // Auto-start match after intro camera sequence
  useEffect(() => {
    if (phase === 'ready' && cameraMode === 'intro') {
      // Show intro for 4 seconds then start match
      const timer = setTimeout(() => {
        startMatch();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [phase, cameraMode, startMatch]);

  // Trigger AI turn when phase is 'thinking'
  useEffect(() => {
    if (phase === 'thinking') {
      // Longer delay for camera to focus on current archer and show them aiming
      const timer = setTimeout(() => {
        executeAITurn();
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [phase, executeAITurn]);

  return null; // This component just handles logic
}
