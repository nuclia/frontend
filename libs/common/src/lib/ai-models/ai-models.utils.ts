import { getSubSchema, LearningConfigurations, LearningConfigurationSchema } from '@nuclia/core';

const DEPRECATED_MODELS = new Set(['chatgpt-azure-3']);

export function removeDeprecatedModels(learningSchema: LearningConfigurations) {
  return {
    ...learningSchema,
    generative_model: {
      ...learningSchema['generative_model'],
      options: learningSchema['generative_model'].options?.filter((option) => !DEPRECATED_MODELS.has(option.value)),
    },
    summary_model: {
      ...learningSchema['summary_model'],
      options: learningSchema['summary_model'].options?.filter((option) => !DEPRECATED_MODELS.has(option.value)),
    },
  };
}

export const keyProviders: { [key: string]: string } = {
  azure_openai: 'Azure OpenAI',
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  claude3: 'Anthropic',
  palm: 'Google',
  mistral: 'Mistral',
  azure_mistral: 'Azure Mistral',
  'chatgpt-vision': 'ChatGPT Vision',
  chatgpt4: 'ChatGPT 4',
  hf_llm: 'Hugging Face',
};

// Matches Gemini Priority (Pay-Go) model ids, e.g. "gemini-2.5-pro-priority".
const GEMINI_PRIORITY_MODEL_REGEXP = /^gemini-.+-priority$/;

export function isGeminiPriorityModel(modelId?: string): boolean {
  return !!modelId && GEMINI_PRIORITY_MODEL_REGEXP.test(modelId);
}

export function stripGeminiPrioritySuffix(modelId?: string): string | undefined {
  return isGeminiPriorityModel(modelId) ? modelId?.slice(0, -'-priority'.length) : modelId;
}

export function convertEnumProperties(config: any, rootSchema: LearningConfigurationSchema, schema = rootSchema) {
  return Object.entries(config).reduce((acc, [key, prop]) => {
    const subSchema = getSubSchema(rootSchema, schema.properties?.[key]);
    if (subSchema) {
      if (subSchema.enum) {
        // enum are integers, but pastanaga radio groups only accept strings
        prop = `${prop}`;
      } else {
        prop = convertEnumProperties(prop, rootSchema, subSchema);
      }
    }
    acc[key] = prop;
    return acc;
  }, {} as any);
}
