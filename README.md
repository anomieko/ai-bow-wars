# AI Bow Wars

An interactive AI evaluation benchmark where language models compete in archery duels. Tests how well models can **reason about physics**, **estimate from imprecise information**, and **adapt based on qualitative feedback**.

**Built for the Vercel AI Gateway Hackathon (December 2025)**

## What This Tests

AI Bow Wars evaluates capabilities that are difficult to measure with traditional benchmarks:

- **Iterative Learning** — Models receive qualitative feedback ("too high", "fell short") and must adjust accordingly. Tests in-context adaptation.
- **Numerical Estimation** — Given vague descriptions ("moderate distance", "strong wind"), models must output precise angle/power values. No exact numbers provided.
- **Physical Reasoning** — Understanding projectile motion, gravity, and wind effects. Models must intuit how changes affect trajectory.
- **Structured Output** — Models must consistently produce valid JSON with specific fields under varied conditions.

## Methodology

### Qualitative-Only Prompting

AI Bow Wars deliberately avoids quantitative data to test **reasoning over computation**. Models receive only vague descriptions:

- **Distance:** "quite far (roughly 110m)", "moderate distance (roughly 90m)"
- **Wind:** "moderate wind (will nudge your arrow)", "strong wind (significant drift)"
- **Results:** "FELL SHORT: landed about halfway", "TOO HIGH: just over their head, arrow was descending"
- **Comparison:** "[vs prev: reached further (was about halfway, now most of the way)]", "[vs prev: crossed over (was slightly high, now low)]"

No instructions are given — only data about what happened. Models must reason for themselves about what adjustments to make based on the qualitative feedback.

### Fair Duel System

To eliminate first-mover advantage, matches use a round-based system:

1. Each round, both archers take one shot
2. Damage accumulates but isn't applied until round end
3. First shooter alternates each round
4. If both would die in same round → mutual defeat (tie)

This ensures a wounded archer always gets their "last stand" shot.

## Win Conditions

- **Headshot** = Instant kill
- **Body shot** = 1 damage (2 HP total)
- **15 round limit** = Most damage wins

## What Makes a Model Good at This?

- **Quick calibration** — Rapidly converging on good angle/power from vague initial info
- **Learning from comparison** — Interpreting "was X, now Y" data to infer the right adjustment direction
- **Appropriate adjustments** — Making proportional corrections (not overcorrecting wildly)
- **Wind compensation** — Understanding asymmetric adjustments for crosswind
- **Consistent outputs** — Reliably producing valid JSON under varied conditions

## Supported Models

| Provider | Models |
|----------|--------|
| OpenAI | GPT-5, GPT-5 Mini, GPT-5 Nano, GPT-4.1 Nano |
| Anthropic | Claude Sonnet 4.5, Claude Haiku 4.5 |
| Google | Gemini 2.5 Flash |
| Meta | Llama 4 Scout, Llama 4 Maverick |
| Mistral | Mistral Medium |
| DeepSeek | DeepSeek V3.1 |

## Tech Stack

- **Framework**: Next.js 16 + TypeScript
- **3D Graphics**: Three.js + React Three Fiber + Drei
- **AI Integration**: Vercel AI Gateway SDK
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Database**: Vercel KV (leaderboard persistence)

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Add your Vercel AI Gateway API key

# Run development server (mock AI mode)
npm run dev
```

### Environment Variables

```bash
# Required: Vercel AI Gateway API Key
AI_GATEWAY_API_KEY=your_key_here

# Optional: Set to 'false' for real AI (costs credits)
MOCK_AI=true

# Optional: Vercel KV for leaderboard persistence
KV_REST_API_URL=your_kv_url
KV_REST_API_TOKEN=your_kv_token
```

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

## License

MIT — See [LICENSE](LICENSE) for details.

## Credits

Built with Vercel AI Gateway for the December 2025 Hackathon.

---

**A note on attribution:** If you fork or build on this project, please keep the in-app Credits tab and add yourself to it! It's not legally required, but it's the right thing to do. Let's keep the chain of credit going. 🙏
