export type InternetProviderType = 'brave' | 'perplexity' | 'tavily' | 'google';
export type GuardrailsProviderType = 'alinia';
export type ProviderType =
  | InternetProviderType
  | GuardrailsProviderType
  | 'cypher'
  | 'nucliadb'
  | 'sql'
  | 'mcpsse'
  | 'mcpstdio';

export type AragModule =
  | 'historical'
  | 'rephrase'
  | 'pre_conditional'
  | 'preprocess_alinia'
  | 'context_conditional'
  | 'ask'
  | 'brave'
  | 'perplexity'
  | 'tavily'
  | 'google'
  | 'sql'
  | 'cypher'
  | 'mcp'
  | 'restricted'
  | 'sparql'
  | 'summarize'
  | 'generate'
  | 'post_conditional'
  | 'remi'
  | 'external'
  | 'restart'
  | 'postprocess_alinia';

export function getCategoryFromModule(
  module: AragModule,
): 'preprocess' | 'context' | 'generation' | 'postprocess' | undefined {
  if (isPreprocessModule(module)) {
    return 'preprocess';
  } else if (isContextModule(module)) {
    return 'context';
  } else if (isGenerationModule(module)) {
    return 'generation';
  } else if (isPostprocessModule(module)) {
    return 'postprocess';
  } else {
    return;
  }
}

const PREPROCESS_MODULES: AragModule[] = ['historical', 'rephrase', 'pre_conditional', 'preprocess_alinia'];
export type PreprocessModule = (typeof PREPROCESS_MODULES)[number];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPreprocessModule(x: any): x is PreprocessModule {
  return PREPROCESS_MODULES.includes(x);
}

const CONTEXT_MODULE: AragModule[] = [
  'brave',
  'perplexity',
  'tavily',
  'google',
  'sql',
  'mcp',
  'cypher',
  'ask',
  'context_conditional',
  'restricted',
  'sparql',
];
export type ContextModule = (typeof CONTEXT_MODULE)[number];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isContextModule(x: any): x is ContextModule {
  return CONTEXT_MODULE.includes(x);
}

const GENERATION_MODULE: AragModule[] = ['summarize', 'generate'];
export type GenerationModule = (typeof GENERATION_MODULE)[number];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isGenerationModule(x: any): x is GenerationModule {
  return GENERATION_MODULE.includes(x);
}

const POSTPROCESS_MODULE: AragModule[] = ['restart', 'remi', 'external', 'post_conditional', 'postprocess_alinia'];
export type PostprocessModule = (typeof POSTPROCESS_MODULE)[number];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function isPostprocessModule(x: any): x is PostprocessModule {
  return POSTPROCESS_MODULE.includes(x);
}
