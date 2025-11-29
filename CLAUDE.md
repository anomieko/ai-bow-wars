# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Context

**Hackathon**: Vercel AI Gateway Hackathon (deadline: December 12, 2025)
**Budget**: $5 AI Gateway credits - use `MOCK_AI=true` during development
**Concept**: Bowman 2-style archery duel where AI models compete turn-by-turn

## Commands

```bash
npm run dev      # Start development server (http://localhost:3000)
npm run build    # Production build
npm run lint     # ESLint
```

## Environment Variables

Copy `env.example` to `.env.local`:
- `AI_GATEWAY_API_KEY` - Vercel AI Gateway key
- `MOCK_AI=true` - Use mock responses (saves API credits during dev)

## Architecture

**AI Bow Wars** - Turn-based archery game where AI models compete. Built for Vercel AI Gateway Hackathon.

### Game Flow

1. **Model Selection** → User picks two AI models (or random)
2. **Match Setup** → `physics.ts:generateMatchSetup()` randomizes distance (80-120m) and wind
3. **Turn Loop** → `GameLoop.tsx` orchestrates:
   - `thinking` phase: Camera focuses on archer
   - `/api/shoot` call: AI generates angle/power
   - `shooting` phase: Arrow animation along simulated path
   - `result` phase: Hit detection, health update
4. **Match End** → Winner recorded to leaderboard via `/api/leaderboard`

### State Management

`game-store.ts` - Zustand store managing:
- `GamePhase`: setup → ready → thinking → shooting → result → finished
- `AppScreen`: menu | custom-select | leaderboard | info | game
- `CameraMode`: intro | left-archer | right-archer | follow-arrow | result | overview

### AI Integration

- **`/api/shoot/route.ts`** - POST endpoint receiving archer state, returns `{angle, power, reasoning}`
- **`prompts.ts`** - Builds estimation-based prompts (no exact values given to AI)
- **`models.ts`** - Model configs with display name, colors, provider. Add new models here.

The AI receives vague distance/wind descriptions and shot feedback ("too high", "too short"), not exact numbers. This forces models to learn from iterative feedback.

### 3D Rendering (React Three Fiber)

- `Arena.tsx` - Main R3F Canvas, lighting, ground
- `Archer.tsx` - Animated stick figure with draw/shoot states
- `Arrow.tsx` - Animates along pre-computed path from `physics.ts`
- `CinematicCamera.tsx` - Smooth transitions between camera modes

### Physics

`physics.ts:simulateArrow()` - Projectile motion with:
- Gravity (9.81 m/s²)
- Wind drift (continuous horizontal force)
- Hit detection: head (0.5m radius circle) = instant kill, body (1m × 1.5m rect) = 1 damage

### Key Types (`types/game.ts`)

- `Archer` - modelId, position, health (2 max), side
- `Shot` - angle (0-90°), power (0-100%), reasoning
- `HitResult` - 'headshot' | 'body' | 'miss' (with distanceX/Y)
- `Turn` - shot + result + arrowPath for replay

## Design Decisions

**Estimation-based prompts**: AIs receive vague descriptions ("moderate distance", "strong wind") instead of exact values. Shot feedback is qualitative ("too high", "slightly short"). This forces models to learn through iterative adjustment rather than calculating optimal trajectories.

**Win conditions**:
- Headshot = instant kill
- Body shot = 1 damage (2 to kill)
- 30 turn limit = most damage wins

## Adding Models

Edit `src/config/models.ts`:
```typescript
{
  id: 'provider/model-name',  // AI Gateway model ID
  name: 'Display Name',
  provider: 'Provider',
  color: '#hexcolor',
  accentColor: '#darker',
  icon: '🎯',
}
```
Unknown models auto-generate colors, so any AI Gateway model works.

## Remaining Work

Per `docs/PLANNING.md`:
- Vercel KV setup for production leaderboard persistence
- Wind particles/indicator visuals
- Hit effect particles
- Performance optimization for deployment
