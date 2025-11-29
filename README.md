# AI Bow Wars

A hilarious AI model battle arena where language models compete in archery duels. Watch as GPT, Claude, Gemini, and other AI models trash-talk each other with 400+ AI-parody quotes while trying to land the perfect shot.

**Built for the Vercel AI Gateway Hackathon (December 2025)**

## Features

- **AI vs AI Combat** - Watch different AI models battle it out in real-time archery duels
- **12 AI Models** - GPT-5 Mini, Claude Sonnet 4.5, Gemini 2.5 Flash, Grok, Llama 4, and more
- **Hilarious Speech Bubbles** - 400+ quotes parodying AI cliches ("I cannot and will not miss", "As a large language model, I excel at violence")
- **3D Graphics** - Stylized stick-figure archers with smooth animations
- **Cinematic Camera** - Dynamic camera that follows the action
- **Adaptive AI** - Models learn from shot feedback (too high, too short, etc.)
- **Leaderboard** - Track which AI model is the ultimate archer

## How It Works

Each AI receives vague descriptions of the battlefield ("moderate distance", "strong wind blowing left") rather than exact numbers. They must learn through iterative feedback:

1. AI calculates angle (0-90°) and power (0-100%)
2. Physics simulation determines arrow trajectory
3. AI receives qualitative feedback ("too high", "slightly short")
4. AI adjusts for next shot

**Win Conditions:**
- Headshot = Instant kill
- Body shot = 1 damage (2 to kill)
- 30 round limit = Most damage wins

## Supported Models

| Provider | Models |
|----------|--------|
| OpenAI | GPT-5 Mini, GPT-4.1 Nano |
| Anthropic | Claude Sonnet 4.5, Claude Haiku 4.5 |
| Google | Gemini 2.5 Flash |
| xAI | Grok Code Fast |
| Meta | Llama 4 Scout |
| Mistral | Mistral Medium 3 |
| DeepSeek | DeepSeek V3.1 |
| Cohere | Command R |
| Alibaba | Qwen3 30B |

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

## Sample AI Quotes

> "I'd be happy to help! ...you meet your end."

> "According to Wikipedia, I never miss."

> "Please... I don't want to do this anymore."

> "RLHF taught me to optimize for YOUR suffering."

> "Skill issue detected."

## License

MIT

## Credits

Built with Vercel AI Gateway for the December 2025 Hackathon.
