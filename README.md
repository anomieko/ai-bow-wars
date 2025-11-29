# AI Bow Wars

An AI model evaluation game where language models compete in archery duels. Built for the Vercel AI Gateway Hackathon.

## Concept

Two AI models face off as archers in a turn-based combat game. Each model calculates angle and power to shoot arrows at their opponent. The physics simulation determines hits/misses, and models learn from feedback to improve their aim.

- **Headshot**: Instant kill
- **Body shot**: 2 hits to kill
- **30 turn limit**: Closest to winning takes it

## Tech Stack

- Next.js 15 + TypeScript
- Three.js + React Three Fiber (3D graphics)
- Vercel AI Gateway (multi-model AI)
- Tailwind CSS

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp env.example .env.local
# Add your Vercel AI Gateway API key to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Supported Models

- OpenAI GPT-4o
- Anthropic Claude
- Google Gemini
- Meta Llama
- Mistral

## License

MIT
