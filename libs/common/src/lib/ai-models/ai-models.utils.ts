import { AccountTypes, LearningConfigurations } from '@nuclia/core';

const MODELS_WITH_LIMITED_MULTILINGUAL_SUPPORT = ['gemini-pro', 'gemini-1-5-pro', 'gemini-1-5-pro-vision'];
const MODELS_STARTER_ACCOUNT = ['chatgpt-azure', 'chatgpt-azure-3', 'generative-multilingual-2023'];

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
