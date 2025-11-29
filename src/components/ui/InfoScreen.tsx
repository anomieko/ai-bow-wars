'use client';

/**
 * Info/How to Play screen
 */

interface InfoScreenProps {
  onBack: () => void;
}

export function InfoScreen({ onBack }: InfoScreenProps) {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-2xl mx-auto">
        {/* Back button */}
        <button
          onClick={onBack}
          className="mb-8 text-gray-400 hover:text-white flex items-center gap-2"
        >
          <span>←</span> Back to Menu
        </button>

        <h1 className="text-4xl font-bold text-white mb-8">How It Works</h1>

        <div className="space-y-8 text-gray-300">
          {/* Concept */}
          <section>
            <h2 className="text-2xl font-semibold text-yellow-500 mb-3">The Concept</h2>
            <p className="leading-relaxed">
              AI Bow Wars is an archery duel game where AI language models compete against each other.
              Two AI archers stand on opposite sides of a battlefield and take turns shooting arrows,
              trying to hit their opponent.
            </p>
          </section>

          {/* How it works */}
          <section>
            <h2 className="text-2xl font-semibold text-yellow-500 mb-3">How AI Takes a Shot</h2>
            <p className="leading-relaxed mb-4">
              Each turn, the AI must <strong>estimate</strong> based on what it can "see":
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>A vague sense of distance ("quite far", "moderate distance")</li>
              <li>General wind conditions ("strong wind blowing left")</li>
              <li>Feedback from previous shots ("too short", "slightly high")</li>
            </ul>
            <p className="mt-4 leading-relaxed">
              The AI doesn't get exact numbers - it must estimate and <strong>learn from feedback</strong>!
              It chooses an <strong>angle</strong> (0-90°) and <strong>power</strong> (0-100%), then adjusts
              based on where the arrow landed.
            </p>
          </section>

          {/* Win conditions */}
          <section>
            <h2 className="text-2xl font-semibold text-yellow-500 mb-3">Win Conditions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-3xl mb-2">🎯</div>
                <h3 className="font-semibold text-white">Headshot</h3>
                <p className="text-sm text-gray-400">Instant kill! Very difficult to land.</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-3xl mb-2">💥</div>
                <h3 className="font-semibold text-white">Body Shots</h3>
                <p className="text-sm text-gray-400">2 body hits to win. Most common victory.</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg">
                <div className="text-3xl mb-2">⏱️</div>
                <h3 className="font-semibold text-white">Turn Limit</h3>
                <p className="text-sm text-gray-400">After 30 turns, most damage wins.</p>
              </div>
            </div>
          </section>

          {/* Match variables */}
          <section>
            <h2 className="text-2xl font-semibold text-yellow-500 mb-3">Match Variables</h2>
            <p className="leading-relaxed mb-4">
              Each match is unique! At the start, these are randomized:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Distance:</strong> 80-120 meters between archers</li>
              <li><strong>Wind:</strong> 0-15 m/s, blowing left or right</li>
            </ul>
            <p className="mt-4 text-gray-400">
              Conditions stay constant throughout the match, so AIs can learn and adjust their aim!
            </p>
          </section>

          {/* The tech */}
          <section>
            <h2 className="text-2xl font-semibold text-yellow-500 mb-3">The Tech</h2>
            <p className="leading-relaxed">
              Built with <strong>Vercel AI Gateway</strong>, which provides unified access to 200+ AI models
              through a single API. This game showcases how different AI models reason and adapt
              in a physics-based challenge.
            </p>
          </section>
        </div>

        {/* Back button at bottom */}
        <button
          onClick={onBack}
          className="mt-12 w-full py-4 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-lg transition-colors"
        >
          Got it! Back to Menu
        </button>
      </div>
    </div>
  );
}
