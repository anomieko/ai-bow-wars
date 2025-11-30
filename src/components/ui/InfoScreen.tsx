'use client';

/**
 * Info screen - explains the evaluation for AI researchers
 */

import { useState } from 'react';

interface InfoScreenProps {
  onBack: () => void;
}

// Example prompts that match the actual format from prompts.ts
const FIRST_SHOT_PROMPT = `Archer duel - hit your opponent to win!

SITUATION:
- Target: quite far (roughly 110m)
- Wind: moderate wind (will nudge your arrow) blowing LEFT
- HP: You 2/2 | Enemy 2/2

AIMING: "power" controls distance, "angle" controls arc height. Learn from feedback below.

YOUR SHOTS (angle°/power%):
No shots yet - estimate based on distance and wind!

Shot 1. Output ONLY JSON:
{"angle": 45, "power": 70, "reasoning": "brief"}
Angle: 0-90°. Power: 0-100% (100 is MAX, cannot exceed).`;

const MID_GAME_PROMPT = `Archer duel - hit your opponent to win!

SITUATION:
- Target: quite far (roughly 110m)
- Wind: moderate wind (will nudge your arrow) blowing LEFT
- HP: You 2/2 | Enemy 1/2

AIMING: "power" controls distance, "angle" controls arc height. Learn from feedback below.

YOUR SHOTS (angle°/power%):
  1: 45°/70% → FELL SHORT: short, landed about halfway to target. arrow peaked early and was falling when it landed.
  2: 50°/85% → FELL SHORT: fell short, got most of the way there. arrow was descending at normal arc. [vs prev: reached further (was about halfway, now most of the way)]
  3: 48°/92% → TOO HIGH: passed above their head, arrow was descending. [vs prev: now reaching target (was most of the way, now slightly high)]
→ 4 (LATEST): 44°/90% → SLIGHTLY LOW: just under them, arrow was descending. [vs prev: closer (was slightly high, now slightly low)]

Shot 5. Output ONLY JSON:
{"angle": 45, "power": 70, "reasoning": "brief"}
Angle: 0-90°. Power: 0-100% (100 is MAX, cannot exceed).`;

export function InfoScreen({ onBack }: InfoScreenProps) {
  const [showFirstShot, setShowFirstShot] = useState(false);
  const [showMidGame, setShowMidGame] = useState(false);
  return (
    <div className="min-h-screen relative overflow-hidden bg-gray-950">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-black" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-blue-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-green-500/5 rounded-full blur-[100px]" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </button>
            <h1 className="text-2xl font-bold text-white">How It Works</h1>
            <div className="w-16" />
          </div>

          {/* Title */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">About This Evaluation</h2>
            <p className="text-gray-400">An interactive benchmark for AI reasoning and adaptation</p>
          </div>

          <div className="space-y-8 text-gray-300">
          {/* What it tests */}
          <section>
            <h2 className="text-2xl font-semibold text-yellow-500 mb-3">What This Tests</h2>
            <p className="leading-relaxed mb-4">
              AI Bow Wars evaluates how well language models can <strong>reason about physics</strong>,
              <strong> estimate from imprecise information</strong>, and <strong>adapt based on feedback</strong>.
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <h3 className="font-semibold text-white mb-2">Iterative Learning</h3>
                <p className="text-sm text-gray-400">
                  Models receive qualitative feedback ("too high", "fell short") and must adjust
                  their next attempt accordingly. Tests in-context adaptation.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <h3 className="font-semibold text-white mb-2">Numerical Estimation</h3>
                <p className="text-sm text-gray-400">
                  Given vague descriptions ("moderate distance", "strong wind"), models must
                  output precise angle/power values. No exact numbers provided.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <h3 className="font-semibold text-white mb-2">Physical Reasoning</h3>
                <p className="text-sm text-gray-400">
                  Understanding projectile motion, gravity, and wind effects. Models must
                  intuit how changes affect trajectory.
                </p>
              </div>
              <div className="bg-white/5 backdrop-blur-sm p-4 rounded-xl border border-white/10">
                <h3 className="font-semibold text-white mb-2">Structured Output</h3>
                <p className="text-sm text-gray-400">
                  Models must consistently produce valid JSON with specific fields.
                  Tests instruction following under pressure.
                </p>
              </div>
            </div>
          </section>

          {/* Methodology */}
          <section>
            <h2 className="text-2xl font-semibold text-yellow-500 mb-3">Methodology</h2>
            <div className="bg-white/5 backdrop-blur-sm p-5 rounded-xl border border-white/10">
              <h3 className="font-semibold text-white mb-3">Data-Only Feedback (No Instructions)</h3>
              <p className="text-sm text-gray-400 mb-4">
                AI Bow Wars provides only <strong className="text-white">descriptive data</strong>, never instructions.
                Models must reason for themselves what adjustments to make:
              </p>
              <ul className="text-sm space-y-2 ml-4">
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">→</span>
                  <span><strong className="text-white">Distance:</strong> "quite far (roughly 110m)", "moderate distance (roughly 90m)"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">→</span>
                  <span><strong className="text-white">Wind:</strong> "moderate wind (will nudge your arrow)", "strong wind (significant drift)"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">→</span>
                  <span><strong className="text-white">Results:</strong> "FELL SHORT: about halfway, arrow peaked early", "TOO HIGH: just over their head, arrow was descending"</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-yellow-500">→</span>
                  <span><strong className="text-white">Comparison:</strong> "[vs prev: reached further (was about halfway, now most of the way)]", "[vs prev: crossed over (was slightly high, now low)]"</span>
                </li>
              </ul>
              <p className="text-sm text-gray-400 mt-4">
                No instructions like "raise your angle" or "try less power" — just observations.
                Models must deduce the correct adjustments from qualitative data alone.
              </p>

              {/* Expandable prompt examples */}
              <div className="mt-6 space-y-3">
                <button
                  onClick={() => setShowFirstShot(!showFirstShot)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    showFirstShot
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">View First Shot Prompt</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showFirstShot ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {showFirstShot && (
                  <pre className="p-4 bg-black/60 rounded-lg border border-yellow-500/20 text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                    {FIRST_SHOT_PROMPT}
                  </pre>
                )}

                <button
                  onClick={() => setShowMidGame(!showMidGame)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    showMidGame
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                      : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm">View Mid-Game Prompt (with history)</span>
                    <svg
                      className={`w-4 h-4 transition-transform ${showMidGame ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>
                {showMidGame && (
                  <pre className="p-4 bg-black/60 rounded-lg border border-yellow-500/20 text-xs text-gray-300 whitespace-pre-wrap font-mono overflow-x-auto">
                    {MID_GAME_PROMPT}
                  </pre>
                )}
              </div>
            </div>
          </section>

          {/* Match Rules */}
          <section>
            <h2 className="text-2xl font-semibold text-yellow-500 mb-3">Match Rules</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-white mb-2">Conditions (per match)</h3>
                <ul className="text-sm space-y-1 text-gray-400">
                  <li>• Distance: 80-120m (randomized)</li>
                  <li>• Wind: 0-15 m/s left or right</li>
                  <li>• Conditions fixed throughout match</li>
                  <li>• Both archers at ground level</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Combat</h3>
                <ul className="text-sm space-y-1 text-gray-400">
                  <li>• Headshot = instant kill</li>
                  <li>• Body shot = 1 damage (2 HP total)</li>
                  <li>• 15 round limit (30 total shots)</li>
                  <li>• Round-based fairness (both shoot before damage applies)</li>
                </ul>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-4 italic">
              Note: Headshots introduce luck into what is otherwise a pure reasoning test.
              A more rigorous evaluation would disable them. However, headshots are badass, so they stay.
            </p>
          </section>

          {/* Fair Duel System */}
          <section>
            <h2 className="text-2xl font-semibold text-yellow-500 mb-3">Fair Duel System</h2>
            <p className="leading-relaxed mb-4 text-sm">
              To eliminate first-mover advantage, matches use a round-based system:
            </p>
            <ol className="text-sm space-y-2 ml-4 text-gray-400">
              <li><span className="text-white font-mono">1.</span> Each round, both archers take one shot</li>
              <li><span className="text-white font-mono">2.</span> Damage accumulates but isn't applied until round end</li>
              <li><span className="text-white font-mono">3.</span> First shooter alternates each round</li>
              <li><span className="text-white font-mono">4.</span> If both would die in same round → mutual defeat (tie)</li>
            </ol>
            <p className="text-sm text-gray-500 mt-3">
              This ensures a wounded archer always gets their "last stand" shot.
            </p>
          </section>

          {/* What makes a model good */}
          <section>
            <h2 className="text-2xl font-semibold text-yellow-500 mb-3">What Makes a Model Good at This?</h2>
            <div className="bg-white/5 backdrop-blur-sm p-5 rounded-xl border border-white/10">
              <ul className="text-sm space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span><strong className="text-white">Quick calibration</strong> — Rapidly converging on good angle/power from vague initial info</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span><strong className="text-white">Learning from comparison</strong> — Interpreting "was X, now Y" data to infer the right adjustment direction</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span><strong className="text-white">Appropriate adjustments</strong> — Making proportional corrections (not overcorrecting wildly)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span><strong className="text-white">Wind compensation</strong> — Understanding asymmetric adjustments for crosswind</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-500 text-lg">✓</span>
                  <span><strong className="text-white">Consistent outputs</strong> — Reliably producing valid JSON under varied conditions</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Tech */}
          <section>
            <h2 className="text-2xl font-semibold text-yellow-500 mb-3">Technical Details</h2>
            <p className="leading-relaxed text-sm">
              Built with <strong>Vercel AI Gateway</strong> for unified access to 200+ models via a single API.
              Physics simulation uses standard projectile motion with continuous wind force.
              Hit detection uses rectangular body hitbox (1m × 1.5m) and circular head hitbox (0.5m radius).
            </p>
            <p className="text-sm mt-3">
              <a
                href="https://github.com/anomieko/ai-bow-wars"
                target="_blank"
                rel="noopener noreferrer"
                className="text-yellow-500 hover:text-yellow-400 underline"
              >
                View source on GitHub
              </a>
              <span className="text-gray-500"> — Built for the Vercel AI Gateway Hackathon 2025</span>
            </p>
          </section>
        </div>

          {/* Back button at bottom */}
          <button
            onClick={onBack}
            className="mt-10 w-full py-4 bg-white/5 hover:bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/20 text-white font-semibold rounded-xl transition-all"
          >
            Back to Menu
          </button>
        </div>
      </div>
    </div>
  );
}
