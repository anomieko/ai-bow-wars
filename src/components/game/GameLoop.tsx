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

// Timeout for AI API calls (15 seconds - some older models think longer)
const AI_TIMEOUT_MS = 15000;
// Cancel match after this many consecutive parse failures for same model
const MAX_PARSE_FAILURES = 2;
// Minimum time for camera to focus on archer before arrow flies
const MIN_CAMERA_FOCUS_MS = 2000;
// Watchdog timeout - if stuck in thinking phase this long, force recovery
const WATCHDOG_TIMEOUT_MS = 20000;
// Max retries for a single turn before cancelling
const MAX_TURN_RETRIES = 1;

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

  // Track retries for current turn
  const turnRetryCountRef = useRef(0);
  const currentTurnIdRef = useRef(0); // Increment each turn to detect stale retries

  // Watchdog timer ref
  const watchdogRef = useRef<NodeJS.Timeout | null>(null);

  // AbortController to cancel in-flight requests when component unmounts (user clicks Menu)
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup: abort any in-flight requests and clear watchdog when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    };
  }, []);

  // Fetch AI shot - returns the shot data without triggering animations
  const fetchAIShot = useCallback(async (): Promise<AIFetchResult> => {
    console.log('[GameLoop] fetchAIShot called for', currentTurn);

    if (!matchSetup || !leftArcher || !rightArcher) {
      console.error('[GameLoop] fetchAIShot: missing state!', { matchSetup: !!matchSetup, leftArcher: !!leftArcher, rightArcher: !!rightArcher });
      return { success: false, shouldCancelMatch: true, cancelReason: 'Game state missing - please restart' };
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
      console.log('[GameLoop] Calling /api/shoot for', currentArcher.modelId);

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
        console.log('[GameLoop] AI request aborted (match cancelled)');
        return { success: false, cancelled: true };
      }

      console.log('[GameLoop] Got response, parsing JSON...');
      const data = await response.json();
      console.log('[GameLoop] API response:', { success: data.success, parseError: data.parseError });

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
        console.log('[GameLoop] AI request aborted (match cancelled or timeout)');
        return { success: false, cancelled: true };
      }

      console.error('[GameLoop] Failed to execute AI turn:', error);

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
  const executeAITurn = useCallback(async (retryAttempt = 0) => {
    const turnId = currentTurnIdRef.current;
    console.log('[GameLoop] executeAITurn started', { currentTurn, turnNumber, retryAttempt, turnId });

    // Clear any existing watchdog
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }

    try {
      // Start both in parallel:
      // 1. Minimum camera focus time (pauseable)
      // 2. AI API call
      const minCameraTime = createPauseableDelay(MIN_CAMERA_FOCUS_MS);
      const aiResult = fetchAIShot();

      // Wait for both to complete
      const [, result] = await Promise.all([minCameraTime, aiResult]);

      // Check if this turn is still valid (user might have cancelled)
      if (turnId !== currentTurnIdRef.current) {
        console.log('[GameLoop] Turn invalidated (turnId mismatch), ignoring result');
        return;
      }

      // Handle result
      if (!result.success) {
        console.warn('[GameLoop] AI turn failed', { cancelled: result.cancelled, shouldCancelMatch: result.shouldCancelMatch, cancelReason: result.cancelReason });
        setThinkingModelId(null);

        // If cancelled, check if it was user-initiated (navigated away) or unexpected (context loss)
        if (result.cancelled) {
          // Check if we're still on the game screen - if so, it wasn't a user cancel
          const currentScreen = useGameStore.getState().screen;
          if (currentScreen !== 'game') {
            console.log('[GameLoop] Turn was cancelled by user navigation, not retrying');
            return;
          }

          // Still on game screen - this was an unexpected abort (WebGL context loss, etc.)
          console.warn('[GameLoop] Request aborted but still in game - likely context loss, retrying...');
          if (retryAttempt < MAX_TURN_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 500));
            if (turnId === currentTurnIdRef.current) {
              await executeAITurn(retryAttempt + 1);
            }
            return;
          }

          // Can't retry - cancel gracefully
          cancelMatch('Connection interrupted - please try again');
          return;
        }

        // If should cancel match, do it
        if (result.shouldCancelMatch) {
          cancelMatch(result.cancelReason || 'AI failed');
          return;
        }

        // Otherwise, this is an unexpected failure - retry once
        if (retryAttempt < MAX_TURN_RETRIES) {
          console.log('[GameLoop] Retrying turn (attempt', retryAttempt + 1, ')');
          // Small delay before retry
          await new Promise(resolve => setTimeout(resolve, 500));
          // Check again if still valid
          if (turnId === currentTurnIdRef.current) {
            await executeAITurn(retryAttempt + 1);
          }
          return;
        }

        // Max retries exceeded - cancel match
        console.error('[GameLoop] Max retries exceeded, cancelling match');
        cancelMatch('AI failed to respond after retries');
        return;
      }

      console.log('[GameLoop] AI turn successful, starting animation');

      // Both ready - now animate!
      setThinkingModelId(null);
      setCameraMode('follow-arrow');
      setCurrentArrowPath(result.simulation.path);
      setPhase('shooting');
      executeShot(result.shot, result.simulation.path, result.simulation.hitResult, result.prompt, result.rawResponse);
    } catch (error) {
      console.error('[GameLoop] Unexpected error in executeAITurn:', error);
      setThinkingModelId(null);

      // Check if still valid turn
      if (turnId !== currentTurnIdRef.current) {
        console.log('[GameLoop] Turn invalidated during error handling');
        return;
      }

      // Retry once on unexpected error
      if (retryAttempt < MAX_TURN_RETRIES) {
        console.log('[GameLoop] Retrying after unexpected error (attempt', retryAttempt + 1, ')');
        await new Promise(resolve => setTimeout(resolve, 500));
        if (turnId === currentTurnIdRef.current) {
          await executeAITurn(retryAttempt + 1);
        }
        return;
      }

      cancelMatch('Unexpected error - please try again');
    }
  }, [
    fetchAIShot,
    setThinkingModelId,
    setCameraMode,
    setCurrentArrowPath,
    setPhase,
    executeShot,
    cancelMatch,
    createPauseableDelay,
    currentTurn,
    turnNumber,
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
      // Increment turn ID to invalidate any stale async operations
      currentTurnIdRef.current += 1;
      turnRetryCountRef.current = 0;
      console.log('[GameLoop] Phase is thinking, starting turn', currentTurnIdRef.current);

      // Start watchdog - if still in thinking after WATCHDOG_TIMEOUT_MS, force recovery
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
      }
      watchdogRef.current = setTimeout(() => {
        const state = useGameStore.getState();
        if (state.phase === 'thinking') {
          console.error('[GameLoop] WATCHDOG: Stuck in thinking phase for', WATCHDOG_TIMEOUT_MS / 1000, 'seconds! Forcing recovery...');
          // Increment turn ID to cancel any pending operations
          currentTurnIdRef.current += 1;
          // Cancel the match
          state.cancelMatch('Turn took too long - connection issue?');
        }
      }, WATCHDOG_TIMEOUT_MS);

      executeAITurn();
    } else {
      // Clear watchdog when leaving thinking phase
      if (watchdogRef.current) {
        clearTimeout(watchdogRef.current);
        watchdogRef.current = null;
      }
    }
  }, [phase, executeAITurn]);

  return null; // This component just handles logic
}
