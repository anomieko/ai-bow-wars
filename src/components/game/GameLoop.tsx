'use client';

/**
 * Game loop component - handles AI turns and game progression
 */

import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/lib/game-store';
import { simulateArrow } from '@/lib/physics';
import { Shot } from '@/types/game';

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

  const executeAITurn = useCallback(async () => {
    if (!matchSetup || !leftArcher || !rightArcher) return;

    const currentArcher = currentTurn === 'left' ? leftArcher : rightArcher;
    const targetArcher = currentTurn === 'left' ? rightArcher : leftArcher;

    setThinkingModelId(currentArcher.modelId);

    try {
      // Call the AI API
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
      });

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

      // Set camera to follow the arrow
      setCameraMode('follow-arrow');

      // Set arrow path for animation
      setCurrentArrowPath(simulation.path);
      setPhase('shooting');

      // Execute the shot (update game state)
      executeShot(shot, simulation.path, simulation.hitResult);
    } catch (error) {
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
      setCameraMode('follow-arrow');
      setCurrentArrowPath(simulation.path);
      setPhase('shooting');
      executeShot(fallbackShot, simulation.path, simulation.hitResult);
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
