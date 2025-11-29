/**
 * AI Model Configuration
 *
 * Adding a new model is easy! Just add an entry to the MODELS array below.
 * The AI Gateway supports 200+ models - see: https://vercel.com/docs/ai-gateway
 *
 * Model ID format varies by provider:
 * - OpenAI: "openai/gpt-4o", "openai/gpt-4o-mini"
 * - Anthropic: "anthropic/claude-3-5-sonnet", "anthropic/claude-3-haiku"
 * - Google: "google/gemini-pro", "google/gemini-1.5-flash"
 * - Meta: "meta/llama-3.1-70b", "meta/llama-3.1-8b"
 * - Mistral: "mistral/mistral-large", "mistral/mistral-small"
 * - And many more...
 */

export interface ModelConfig {
  id: string;           // AI Gateway model ID (e.g., "openai/gpt-4o")
  name: string;         // Display name (e.g., "GPT-4o")
  provider: string;     // Provider name (e.g., "OpenAI")
  color: string;        // Primary color (hex)
  accentColor: string;  // Darker accent (hex)
  icon: string;         // Emoji or icon
  tier?: 'fast' | 'balanced' | 'premium';  // Cost/speed tier
  enabled?: boolean;    // Set to false to disable without removing
}

/**
 * Add models here! The order determines the default display order.
 */
export const MODELS: ModelConfig[] = [
  // === OpenAI ===
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'OpenAI',
    color: '#10a37f',
    accentColor: '#0d8a6a',
    icon: '🟢',
    tier: 'premium',
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini',
    provider: 'OpenAI',
    color: '#10a37f',
    accentColor: '#0d8a6a',
    icon: '💚',
    tier: 'fast',
  },

  // === Anthropic ===
  {
    id: 'anthropic/claude-3-5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'Anthropic',
    color: '#d97706',
    accentColor: '#b45309',
    icon: '🟠',
    tier: 'premium',
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'Anthropic',
    color: '#f59e0b',
    accentColor: '#d97706',
    icon: '🧡',
    tier: 'fast',
  },

  // === Google ===
  {
    id: 'google/gemini-1.5-pro',
    name: 'Gemini 1.5 Pro',
    provider: 'Google',
    color: '#4285f4',
    accentColor: '#1967d2',
    icon: '🔵',
    tier: 'premium',
  },
  {
    id: 'google/gemini-1.5-flash',
    name: 'Gemini 1.5 Flash',
    provider: 'Google',
    color: '#34a853',
    accentColor: '#1e8e3e',
    icon: '💙',
    tier: 'fast',
  },

  // === Meta ===
  {
    id: 'meta/llama-3.1-70b',
    name: 'Llama 3.1 70B',
    provider: 'Meta',
    color: '#7c3aed',
    accentColor: '#5b21b6',
    icon: '🟣',
    tier: 'balanced',
  },
  {
    id: 'meta/llama-3.1-8b',
    name: 'Llama 3.1 8B',
    provider: 'Meta',
    color: '#a78bfa',
    accentColor: '#7c3aed',
    icon: '💜',
    tier: 'fast',
  },

  // === Mistral ===
  {
    id: 'mistral/mistral-large',
    name: 'Mistral Large',
    provider: 'Mistral',
    color: '#f97316',
    accentColor: '#ea580c',
    icon: '🟧',
    tier: 'premium',
  },
  {
    id: 'mistral/mistral-small',
    name: 'Mistral Small',
    provider: 'Mistral',
    color: '#fb923c',
    accentColor: '#f97316',
    icon: '🔶',
    tier: 'fast',
  },

  // === Cohere ===
  {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    provider: 'Cohere',
    color: '#6366f1',
    accentColor: '#4f46e5',
    icon: '🔮',
    tier: 'premium',
  },

  // === Groq (Fast inference) ===
  {
    id: 'groq/llama-3.1-70b',
    name: 'Llama 3.1 70B (Groq)',
    provider: 'Groq',
    color: '#ef4444',
    accentColor: '#dc2626',
    icon: '🔴',
    tier: 'fast',
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
  // Simple hash to generate consistent color for unknown models
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

  // Generate config for unknown model
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
