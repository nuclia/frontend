import { AccountTypes, LearningConfigurations } from '@nuclia/core';

const MODELS_WITH_LIMITED_MULTILINGUAL_SUPPORT = ['gemini-pro', 'gemini-1-5-pro', 'gemini-1-5-pro-vision'];
const MODELS_STARTER_ACCOUNT = ['chatgpt-azure', 'chatgpt-azure-3', 'generative-multilingual-2023'];
const DEPRECATED_MODELS = ['chatgpt-azure-3'];

export function getUnsupportedGenerativeModels(
  learningConfiguration: LearningConfigurations,
  semanticModel: string,
  accountType: AccountTypes,
): string[] {
  const options = learningConfiguration['generative_model'].options || [];
  return [
    ...(semanticModel === 'multilingual-2023-08-16'
      ? options.filter((model) => MODELS_WITH_LIMITED_MULTILINGUAL_SUPPORT.includes(model.value))
      : []),
    ...(accountType === 'v3starter' || accountType === 'stash-starter'
      ? options.filter((model) => !MODELS_STARTER_ACCOUNT.includes(model.value))
      : []),
  ].map((model) => model.value);
}

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
