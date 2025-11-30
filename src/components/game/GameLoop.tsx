'use client';

/**
 * Game loop component - handles AI turns and game progression
 *
 * Optimized flow: AI call starts immediately in parallel with camera animation.
 * We wait for BOTH to complete before showing the arrow.
 */

import { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from '@/lib/game-store';
import { useDebugStore } from '@/lib/debug-store';
import { simulateArrow } from '@/lib/physics';
import { Shot, HitResult, Vector2 } from '@/types/game';
import { usePauseableTimeout, usePauseableDelay } from '@/lib/use-pause';

// Timeout for AI API calls (10 seconds)
const AI_TIMEOUT_MS = 10000;
// Cancel match after this many consecutive parse failures for same model
const MAX_PARSE_FAILURES = 2;
// Minimum time for camera to focus on archer before arrow flies
const MIN_CAMERA_FOCUS_MS = 2000;

// Result from fetching AI shot
type AIFetchResult = {
  success: true;
  shot: Shot;
  simulation: {
    path: Vector2[];
    hitResult: HitResult;
  };
  prompt?: string;
  rawResponse?: string;
} | {
  success: false;
  cancelled?: boolean;
  shouldCancelMatch?: boolean;
  cancelReason?: string;
}

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
    cancelMatch,
    isPaused,
  } = useGameStore();

  // Debug store for test mode cheats
  const getDebugHitResult = useDebugStore((s) => s.getDebugHitResult);

  // Pauseable delay for camera focus time
  const createPauseableDelay = usePauseableDelay();

  // Track consecutive parse failures per model
  const parseFailuresRef = useRef<{ left: number; right: number }>({ left: 0, right: 0 });

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

  // Fetch AI shot - returns the shot data without triggering animations
  const fetchAIShot = useCallback(async (): Promise<AIFetchResult> => {
    if (!matchSetup || !leftArcher || !rightArcher) {
      return { success: false };
    }

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
        return { success: false, cancelled: true };
      }

      const data = await response.json();

      // Track failures (API errors or parse errors)
      const hasError = !data.success || data.parseError;

      if (hasError) {
        parseFailuresRef.current[currentTurn]++;
        const errorType = !data.success ? 'API error' : 'Parse failure';
        console.warn(`${errorType} #${parseFailuresRef.current[currentTurn]} for ${currentTurn} archer:`, data.error || data.rawResponse);

        // Cancel match if too many consecutive failures
        if (parseFailuresRef.current[currentTurn] >= MAX_PARSE_FAILURES) {
          console.error(`Cancelling match: ${currentArcher.modelId} failed ${MAX_PARSE_FAILURES} times`);
          return {
            success: false,
            shouldCancelMatch: true,
            cancelReason: `${currentArcher.modelId} failed to respond properly`
          };
        }

        // Use fallback shot if API error (parse errors already have smart fallback from API)
        if (!data.success) {
          data.shot = { angle: 45, power: 70, reasoning: 'API error fallback' };
        }
      } else {
        // Reset failure count on success
        parseFailuresRef.current[currentTurn] = 0;
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

      return {
        success: true,
        shot,
        simulation: {
          path: simulation.path,
          hitResult: finalHitResult,
        },
        prompt: data.prompt,
        rawResponse: data.rawResponse,
      };
    } catch (error) {
      clearTimeout(timeoutId);

      // Don't process errors if aborted (user cancelled match)
      if (signal.aborted) {
        console.log('AI request aborted (match cancelled or timeout)');
        return { success: false, cancelled: true };
      }

      console.error('Failed to execute AI turn:', error);

      // Fallback shot on error
      const currentArcher = currentTurn === 'left' ? leftArcher : rightArcher;
      const targetArcher = currentTurn === 'left' ? rightArcher : leftArcher;
      const fallbackShot: Shot = { angle: 45, power: 70, reasoning: 'Error fallback' };
      const simulation = simulateArrow(
        currentArcher!.position,
        fallbackShot.angle,
        fallbackShot.power,
        matchSetup!.wind,
        targetArcher!
      );
      const finalHitResult = getDebugHitResult(currentTurn, simulation.hitResult);

      return {
        success: true,
        shot: fallbackShot,
        simulation: {
          path: simulation.path,
          hitResult: finalHitResult,
        },
      };
    }
  }, [
    matchSetup,
    leftArcher,
    rightArcher,
    currentTurn,
    turnNumber,
    turns,
    setThinkingModelId,
    getDebugHitResult,
  ]);

  // Execute the full AI turn: fetch in parallel with camera, then animate
  const executeAITurn = useCallback(async () => {
    // Start both in parallel:
    // 1. Minimum camera focus time (pauseable)
    // 2. AI API call
    const minCameraTime = createPauseableDelay(MIN_CAMERA_FOCUS_MS);
    const aiResult = fetchAIShot();

    // Wait for both to complete
    const [, result] = await Promise.all([minCameraTime, aiResult]);

    // Handle result
    if (!result.success) {
      setThinkingModelId(null);
      if (result.shouldCancelMatch) {
        cancelMatch(result.cancelReason || 'AI failed');
      }
      // If cancelled by user, do nothing (match already cancelled)
      return;
    }

    // Both ready - now animate!
    setThinkingModelId(null);
    setCameraMode('follow-arrow');
    setCurrentArrowPath(result.simulation.path);
    setPhase('shooting');
    executeShot(result.shot, result.simulation.path, result.simulation.hitResult, result.prompt, result.rawResponse);
  }, [
    fetchAIShot,
    setThinkingModelId,
    setCameraMode,
    setCurrentArrowPath,
    setPhase,
    executeShot,
    cancelMatch,
    createPauseableDelay,
  ]);

  // Auto-start match after intro camera sequence (pauseable)
  const shouldStartMatch = phase === 'ready' && cameraMode === 'intro';
  usePauseableTimeout(
    () => {
      startMatch();
    },
    shouldStartMatch ? 4000 : null,
    [startMatch]
  );

  // Trigger AI turn IMMEDIATELY when phase is 'thinking'
  // AI call runs in parallel with camera animation
  useEffect(() => {
    if (phase === 'thinking') {
      executeAITurn();
    }
  }, [phase, executeAITurn]);

  return null; // This component just handles logic
}
