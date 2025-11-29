'use client';

/**
 * Model selection UI - Modern clean design
 */

import { useState } from 'react';
import { MODELS, getModelConfig } from '@/config/models';
import { useGameStore } from '@/lib/game-store';

export function ModelSelector() {
  const [leftModel, setLeftModel] = useState(MODELS[0]?.id || '');
  const [rightModel, setRightModel] = useState(MODELS[1]?.id || '');
  const { selectModels, phase, setScreen } = useGameStore();

  const handleStart = () => {
    if (leftModel && rightModel) {
      selectModels(leftModel, rightModel);
    }
  };

  const leftConfig = leftModel ? getModelConfig(leftModel) : null;
  const rightConfig = rightModel ? getModelConfig(rightModel) : null;

  if (phase !== 'setup') return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <div className="px-4 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setScreen('menu')}
            className="flex items-center gap-2 text-white/50 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
          <h1 className="text-xl font-bold text-white">Custom Match</h1>
          <div className="w-16" />
        </div>
      </div>

      {/* VS Preview */}
      <div className="px-4 py-8">
        <div className="max-w-2xl mx-auto flex items-center justify-center gap-4 md:gap-6">
          {/* Left preview */}
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-2xl min-w-[150px] md:min-w-[200px] transition-all duration-300"
            style={{
              backgroundColor: leftConfig ? `${leftConfig.color}20` : 'rgba(255,255,255,0.05)',
              boxShadow: leftConfig ? `0 0 30px ${leftConfig.color}30` : 'none',
            }}
          >
            <span className="text-4xl md:text-5xl">{leftConfig?.icon || '?'}</span>
            <div>
              <div className="font-bold text-white text-base md:text-lg">{leftConfig?.name || 'Select...'}</div>
              <div className="text-sm text-white/50">{leftConfig?.provider || ''}</div>
            </div>
          </div>

          {/* VS */}
          <div className="text-2xl font-black text-white/30">VS</div>

          {/* Right preview */}
          <div
            className="flex items-center gap-3 px-5 py-4 rounded-2xl min-w-[150px] md:min-w-[200px] transition-all duration-300"
            style={{
              backgroundColor: rightConfig ? `${rightConfig.color}20` : 'rgba(255,255,255,0.05)',
              boxShadow: rightConfig ? `0 0 30px ${rightConfig.color}30` : 'none',
            }}
          >
            <span className="text-4xl md:text-5xl">{rightConfig?.icon || '?'}</span>
            <div>
              <div className="font-bold text-white text-base md:text-lg">{rightConfig?.name || 'Select...'}</div>
              <div className="text-sm text-white/50">{rightConfig?.provider || ''}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Selection panels */}
      <div className="flex-1 px-4 pb-4 overflow-auto">
        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-4">
          {/* Left archer panel */}
          <div>
            <h3 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-3 px-1">Left Archer</h3>
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
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-white/50'
                        : isDisabled
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-white/5'
                    }`}
                    style={{
                      backgroundColor: isSelected ? `${config.color}25` : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span className="text-3xl">{config.icon}</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-white">{config.name}</div>
                      <div className="text-sm text-white/40">{config.provider}</div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right archer panel */}
          <div>
            <h3 className="text-white/40 text-xs font-medium uppercase tracking-widest mb-3 px-1">Right Archer</h3>
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
                    className={`w-full p-4 rounded-xl flex items-center gap-4 transition-all duration-200 ${
                      isSelected
                        ? 'ring-2 ring-white/50'
                        : isDisabled
                          ? 'opacity-30 cursor-not-allowed'
                          : 'hover:bg-white/5'
                    }`}
                    style={{
                      backgroundColor: isSelected ? `${config.color}25` : 'rgba(255,255,255,0.03)',
                    }}
                  >
                    <span className="text-3xl">{config.icon}</span>
                    <div className="text-left flex-1">
                      <div className="font-semibold text-white">{config.name}</div>
                      <div className="text-sm text-white/40">{config.provider}</div>
                    </div>
                    {isSelected && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom action */}
      <div className="px-4 py-6">
        <div className="max-w-sm mx-auto">
          <button
            onClick={handleStart}
            disabled={!leftModel || !rightModel || leftModel === rightModel}
            className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/30 text-white rounded-2xl px-6 py-5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 shadow-[0_10px_40px_-10px_rgba(16,185,129,0.5)] disabled:shadow-none"
          >
            <span className="text-xl font-bold">Start Battle</span>
          </button>
        </div>
      </div>
    </div>
  );
}
