/**
 * AI Model Configuration - Updated November 2025
 *
 * Adding a new model is easy! Just add an entry to the MODELS array below.
 * The AI Gateway supports 200+ models - see: https://vercel.com/ai-gateway/models
 */

export interface ModelConfig {
  id: string;           // AI Gateway model ID (e.g., "openai/gpt-5")
  name: string;         // Display name (e.g., "GPT-5")
  provider: string;     // Provider name (e.g., "OpenAI")
  color: string;        // Primary color (hex)
  accentColor: string;  // Darker accent (hex)
  icon: string;         // Emoji or icon
  tier?: 'fast' | 'balanced' | 'premium';  // Cost/speed tier
  enabled?: boolean;    // Set to false to disable without removing
}

/**
 * Latest models as of November 2025
 * Sources:
 * - https://vercel.com/ai-gateway/models
 * - https://openai.com/index/gpt-5-1/
 * - https://www.anthropic.com/claude/sonnet
 * - https://deepmind.google/models/gemini/
 * - https://x.ai/news/grok-4
 * - https://ai.meta.com/blog/llama-4-multimodal-intelligence/
 */
export const MODELS: ModelConfig[] = [
  // === OpenAI (GPT-5.1 series - Nov 2025) ===
  {
    id: 'openai/gpt-5.1',
    name: 'GPT-5.1',
    provider: 'OpenAI',
    color: '#10a37f',
    accentColor: '#0d8a6a',
    icon: '🟢',
    tier: 'premium',
  },
  {
    id: 'openai/gpt-5',
    name: 'GPT-5',
    provider: 'OpenAI',
    color: '#10a37f',
    accentColor: '#0d8a6a',
    icon: '💚',
    tier: 'premium',
  },
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'OpenAI',
    color: '#34d399',
    accentColor: '#10a37f',
    icon: '🌿',
    tier: 'fast',
  },

  // === Anthropic (Claude 4.5 series - Sep-Nov 2025) ===
  {
    id: 'anthropic/claude-opus-4.5',
    name: 'Claude Opus 4.5',
    provider: 'Anthropic',
    color: '#d97706',
    accentColor: '#b45309',
    icon: '🟠',
    tier: 'premium',
  },
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    color: '#f59e0b',
    accentColor: '#d97706',
    icon: '🧡',
    tier: 'balanced',
  },
  {
    id: 'anthropic/claude-haiku-4.5',
    name: 'Claude Haiku 4.5',
    provider: 'Anthropic',
    color: '#fbbf24',
    accentColor: '#f59e0b',
    icon: '💛',
    tier: 'fast',
  },

  // === Google (Gemini 3 - Nov 2025) ===
  {
    id: 'google/gemini-3-pro-preview',
    name: 'Gemini 3 Pro',
    provider: 'Google',
    color: '#4285f4',
    accentColor: '#1967d2',
    icon: '🔵',
    tier: 'premium',
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    color: '#34a853',
    accentColor: '#1e8e3e',
    icon: '💚',
    tier: 'fast',
  },
  {
    id: 'google/gemini-2.5-flash-lite',
    name: 'Gemini 2.5 Flash Lite',
    provider: 'Google',
    color: '#7cb342',
    accentColor: '#558b2f',
    icon: '🌱',
    tier: 'fast',
  },

  // === xAI (Grok 4.1 - Nov 2025) ===
  {
    id: 'xai/grok-4.1',
    name: 'Grok 4.1',
    provider: 'xAI',
    color: '#000000',
    accentColor: '#1a1a1a',
    icon: '⚫',
    tier: 'premium',
  },
  {
    id: 'xai/grok-code-fast-1',
    name: 'Grok Code Fast',
    provider: 'xAI',
    color: '#ef4444',
    accentColor: '#dc2626',
    icon: '🔴',
    tier: 'fast',
  },
  {
    id: 'xai/grok-4-fast',
    name: 'Grok 4 Fast',
    provider: 'xAI',
    color: '#374151',
    accentColor: '#1f2937',
    icon: '⬛',
    tier: 'balanced',
  },

  // === Meta (Llama 4 - April 2025) ===
  {
    id: 'meta/llama-4-maverick',
    name: 'Llama 4 Maverick',
    provider: 'Meta',
    color: '#7c3aed',
    accentColor: '#5b21b6',
    icon: '🟣',
    tier: 'premium',
  },
  {
    id: 'meta/llama-4-scout',
    name: 'Llama 4 Scout',
    provider: 'Meta',
    color: '#a78bfa',
    accentColor: '#7c3aed',
    icon: '💜',
    tier: 'balanced',
  },

  // === Mistral (2025) ===
  {
    id: 'mistral/mistral-medium-3',
    name: 'Mistral Medium 3',
    provider: 'Mistral',
    color: '#f97316',
    accentColor: '#ea580c',
    icon: '🟧',
    tier: 'balanced',
  },
  {
    id: 'mistral/mistral-large-2411',
    name: 'Mistral Large',
    provider: 'Mistral',
    color: '#fb923c',
    accentColor: '#f97316',
    icon: '🔶',
    tier: 'premium',
  },

  // === DeepSeek (V3.2 - Sep 2025) ===
  {
    id: 'deepseek/deepseek-v3.2-exp',
    name: 'DeepSeek V3.2',
    provider: 'DeepSeek',
    color: '#6366f1',
    accentColor: '#4f46e5',
    icon: '🔮',
    tier: 'balanced',
  },
  {
    id: 'deepseek/deepseek-v3.1',
    name: 'DeepSeek V3.1',
    provider: 'DeepSeek',
    color: '#818cf8',
    accentColor: '#6366f1',
    icon: '💎',
    tier: 'fast',
  },

  // === Cohere ===
  {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    provider: 'Cohere',
    color: '#14b8a6',
    accentColor: '#0d9488',
    icon: '🩵',
    tier: 'balanced',
  },

  // === Perplexity ===
  {
    id: 'perplexity/sonar-pro',
    name: 'Sonar Pro',
    provider: 'Perplexity',
    color: '#22d3ee',
    accentColor: '#06b6d4',
    icon: '🌊',
    tier: 'balanced',
  },

  // === Add more models below! ===
  // {
  //   id: 'provider/model-name',
  //   name: 'Display Name',
  //   provider: 'Provider',
  //   color: '#hexcolor',
  //   accentColor: '#darker-hex',
  //   icon: '🎯',
  //   tier: 'balanced',
  // },
];

// === Helper Functions ===

/** Get all enabled models */
export function getEnabledModels(): ModelConfig[] {
  return MODELS.filter(m => m.enabled !== false);
}

/** Get model by ID */
export function getModelById(id: string): ModelConfig | undefined {
  return MODELS.find(m => m.id === id);
}

/** Get models by provider */
export function getModelsByProvider(provider: string): ModelConfig[] {
  return MODELS.filter(m => m.provider === provider && m.enabled !== false);
}

/** Get models by tier */
export function getModelsByTier(tier: 'fast' | 'balanced' | 'premium'): ModelConfig[] {
  return MODELS.filter(m => m.tier === tier && m.enabled !== false);
}

/** Get unique providers */
export function getProviders(): string[] {
  const providers = new Set(MODELS.filter(m => m.enabled !== false).map(m => m.provider));
  return Array.from(providers);
}

/** Generate a color for unknown models */
export function generateModelColor(modelId: string): string {
  let hash = 0;
  for (let i = 0; i < modelId.length; i++) {
    hash = modelId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 50%)`;
}

/** Get model config or generate a default for unknown models */
export function getModelConfig(modelId: string): ModelConfig {
  const known = getModelById(modelId);
  if (known) return known;

  const [provider, name] = modelId.split('/');
  return {
    id: modelId,
    name: name || modelId,
    provider: provider || 'Unknown',
    color: generateModelColor(modelId),
    accentColor: generateModelColor(modelId + '-accent'),
    icon: '⚪',
    tier: 'balanced',
  };
}
