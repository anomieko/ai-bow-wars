'use client';

/**
 * Debug panel - only visible in mock/test mode
 * Provides cheats for testing specific game scenarios
 */

import { useEffect, useState } from 'react';
import { useDebugStore, DebugHitOverride } from '@/lib/debug-store';

export function DebugPanel() {
  const [isExpanded, setIsExpanded] = useState(false);
  const {
    isDebugAvailable,
    setDebugAvailable,
    hitOverride,
    setHitOverride,
    forceTieMode,
    setForceTieMode,
  } = useDebugStore();

  // Check if mock mode is enabled on mount
  useEffect(() => {
    async function checkMockMode() {
      try {
        const res = await fetch('/api/config');
        const data = await res.json();
        setDebugAvailable(data.mockMode === true);
      } catch {
        setDebugAvailable(false);
      }
    }
    checkMockMode();
  }, [setDebugAvailable]);

  // Don't render anything if debug is not available
  if (!isDebugAvailable) {
    return null;
  }

  const hitOptions: { value: DebugHitOverride; label: string; color: string }[] = [
    { value: 'none', label: 'Normal', color: 'bg-gray-600' },
    { value: 'headshot', label: 'Headshots', color: 'bg-red-600' },
    { value: 'bodyshot', label: 'Body Hits', color: 'bg-orange-600' },
    { value: 'miss', label: 'All Miss', color: 'bg-gray-500' },
  ];

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {/* Collapsed state - small debug button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="px-3 py-2 bg-purple-900/80 hover:bg-purple-800 text-purple-300 text-xs font-mono rounded-lg backdrop-blur-sm border border-purple-700 transition-colors"
        >
          DEBUG
        </button>
      )}

      {/* Expanded debug panel */}
      {isExpanded && (
        <div className="bg-gray-900/95 backdrop-blur-sm rounded-lg border border-purple-600 p-4 w-64">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-purple-400 font-mono text-sm font-bold">DEBUG</span>
              <span className="text-xs text-purple-600">(test mode)</span>
            </div>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-500 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>

          {/* Force Tie Toggle */}
          <div className="mb-4">
            <label className="flex items-center gap-3 cursor-pointer group">
              <div
                className={`w-10 h-5 rounded-full transition-colors ${
                  forceTieMode ? 'bg-purple-600' : 'bg-gray-700'
                }`}
                onClick={() => setForceTieMode(!forceTieMode)}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform mt-0.5 ${
                    forceTieMode ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <div>
                <div className="text-white text-sm font-medium group-hover:text-purple-300 transition-colors">
                  Force Tie
                </div>
                <div className="text-xs text-gray-500">Both archers headshot</div>
              </div>
            </label>
          </div>

          {/* Hit Override Buttons */}
          <div className="space-y-2">
            <div className="text-xs text-gray-400 mb-2">Shot Results:</div>
            <div className="grid grid-cols-2 gap-2">
              {hitOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setHitOverride(option.value)}
                  disabled={forceTieMode}
                  className={`px-3 py-2 rounded text-xs font-medium transition-all ${
                    hitOverride === option.value && !forceTieMode
                      ? `${option.color} text-white ring-2 ring-white/30`
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  } ${forceTieMode ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Current status */}
          <div className="mt-4 pt-3 border-t border-gray-700">
            <div className="text-xs text-gray-500">
              Active:{' '}
              <span className="text-purple-400">
                {forceTieMode
                  ? 'Force Tie'
                  : hitOverride !== 'none'
                    ? hitOptions.find(o => o.value === hitOverride)?.label
                    : 'None'}
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="mt-3 text-xs text-yellow-600/70 leading-tight">
            Debug cheats only work in test mode with mock AI.
          </div>
        </div>
      )}
    </div>
  );
}
