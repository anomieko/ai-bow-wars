/**
 * AI Model Configuration - November 2025
 *
 * COST-OPTIMIZED: Using latest generation but cheapest tier from each provider
 * to maximize our $5 AI Gateway credits!
 *
 * Adding a new model: Just add an entry to the MODELS array below.
 * Full model list: https://vercel.com/ai-gateway/models
 */

export interface ModelConfig {
  id: string;           // AI Gateway model ID
  name: string;         // Display name
  provider: string;     // Provider name
  color: string;        // Primary color (hex)
  accentColor: string;  // Darker accent (hex)
  icon: string;         // Emoji icon
  enabled?: boolean;    // Set to false to disable
}

/**
 * Cost-optimized models - Latest gen, cheapest tier
 */
export const MODELS: ModelConfig[] = [
  // === OpenAI ===
  {
    id: 'openai/gpt-5-mini',
    name: 'GPT-5 Mini',
    provider: 'OpenAI',
    color: '#10a37f',
    accentColor: '#0d8a6a',
    icon: '🟢',
  },

  // === Anthropic ===
  {
    id: 'anthropic/claude-sonnet-4.5',
    name: 'Claude Sonnet 4.5',
    provider: 'Anthropic',
    color: '#d97706',
    accentColor: '#b45309',
    icon: '🟠',
  },

  // === Google ===
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash',
    provider: 'Google',
    color: '#4285f4',
    accentColor: '#1967d2',
    icon: '🔵',
  },

  // === xAI ===
  {
    id: 'xai/grok-code-fast-1',
    name: 'Grok Code Fast',
    provider: 'xAI',
    color: '#ef4444',
    accentColor: '#dc2626',
    icon: '🔴',
  },

  // === Meta ===
  {
    id: 'meta/llama-4-scout',
    name: 'Llama 4 Scout',
    provider: 'Meta',
    color: '#7c3aed',
    accentColor: '#5b21b6',
    icon: '🟣',
  },

  // === Mistral ===
  {
    id: 'mistral/mistral-medium-3',
    name: 'Mistral Medium 3',
    provider: 'Mistral',
    color: '#f97316',
    accentColor: '#ea580c',
    icon: '🟧',
  },

  // === DeepSeek ===
  {
    id: 'deepseek/deepseek-v3.1',
    name: 'DeepSeek V3.1',
    provider: 'DeepSeek',
    color: '#6366f1',
    accentColor: '#4f46e5',
    icon: '🔮',
  },

  // === Cohere ===
  {
    id: 'cohere/command-r',
    name: 'Command R',
    provider: 'Cohere',
    color: '#14b8a6',
    accentColor: '#0d9488',
    icon: '🩵',
  },

  // === Alibaba (Qwen3 - Apr 2025) ===
  {
    id: 'qwen/qwen3-30b-a3b',
    name: 'Qwen3 30B',
    provider: 'Alibaba',
    color: '#ff6a00',
    accentColor: '#e55d00',
    icon: '🧡',
  },
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
  };
}
