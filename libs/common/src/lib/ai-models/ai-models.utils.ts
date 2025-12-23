import { getSubSchema, LearningConfigurations, LearningConfigurationSchema } from '@nuclia/core';

const DEPRECATED_MODELS = ['chatgpt-azure-3'];

export function removeDeprecatedModels(learningSchema: LearningConfigurations) {
  return {
    ...learningSchema,
    generative_model: {
      ...learningSchema['generative_model'],
      options: learningSchema['generative_model'].options?.filter(
        (option) => !DEPRECATED_MODELS.includes(option.value),
      ),
    },
    summary_model: {
      ...learningSchema['summary_model'],
      options: learningSchema['summary_model'].options?.filter((option) => !DEPRECATED_MODELS.includes(option.value)),
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
