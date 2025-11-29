'use client';

/**
 * Model selection UI for choosing AI contestants
 */

import { useState } from 'react';
import { MODELS, getModelConfig } from '@/config/models';
import { useGameStore } from '@/lib/game-store';

export function ModelSelector() {
  const [leftModel, setLeftModel] = useState(MODELS[0]?.id || '');
  const [rightModel, setRightModel] = useState(MODELS[1]?.id || '');
  const { selectModels, phase } = useGameStore();

  const handleStart = () => {
    if (leftModel && rightModel) {
      selectModels(leftModel, rightModel);
    }
  };

  if (phase !== 'setup') return null;

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-6">
      <h2 className="text-2xl font-bold text-center text-white">Select Contestants</h2>

      <div className="grid grid-cols-2 gap-8">
        {/* Left archer selector */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-300">Left Archer</h3>
          <div className="space-y-2">
            {MODELS.map((model) => {
              const config = getModelConfig(model.id);
              const isSelected = leftModel === model.id;
              const isDisabled = rightModel === model.id;

              return (
                <button
                  key={model.id}
                  onClick={() => setLeftModel(model.id)}
                  disabled={isDisabled}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'ring-2 ring-white bg-opacity-30'
                      : isDisabled
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-opacity-20'
                  }`}
                  style={{
                    backgroundColor: isSelected ? config.color : `${config.color}33`,
                  }}
                >
                  <span className="text-2xl">{config.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-white">{config.name}</div>
                    <div className="text-xs text-gray-300">{config.provider}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right archer selector */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-300">Right Archer</h3>
          <div className="space-y-2">
            {MODELS.map((model) => {
              const config = getModelConfig(model.id);
              const isSelected = rightModel === model.id;
              const isDisabled = leftModel === model.id;

              return (
                <button
                  key={model.id}
                  onClick={() => setRightModel(model.id)}
                  disabled={isDisabled}
                  className={`w-full p-3 rounded-lg flex items-center gap-3 transition-all ${
                    isSelected
                      ? 'ring-2 ring-white bg-opacity-30'
                      : isDisabled
                        ? 'opacity-30 cursor-not-allowed'
                        : 'hover:bg-opacity-20'
                  }`}
                  style={{
                    backgroundColor: isSelected ? config.color : `${config.color}33`,
                  }}
                >
                  <span className="text-2xl">{config.icon}</span>
                  <div className="text-left">
                    <div className="font-semibold text-white">{config.name}</div>
                    <div className="text-xs text-gray-300">{config.provider}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <button
        onClick={handleStart}
        disabled={!leftModel || !rightModel || leftModel === rightModel}
        className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-bold text-xl rounded-lg transition-colors"
      >
        Set Up Match
      </button>
    </div>
  );
}
