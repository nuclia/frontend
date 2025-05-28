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

export type PreprocessModule = 'historical' | 'rephrase' | 'pre_conditional' | 'preprocess_alinia';
export type ContextModule =
  | InternetProviderType
  | 'sql'
  | 'mcp'
  | 'cypher'
  | 'ask'
  | 'context_conditional'
  | 'restricted'
  | 'sparql';
export type GenerationModule = 'summarize' | 'generate';
export type PostprocessModule = 'restart' | 'remi' | 'external' | 'post_conditional' | 'postprocess_alinia';
export type AragModule = PreprocessModule | ContextModule | GenerationModule | PostprocessModule;
