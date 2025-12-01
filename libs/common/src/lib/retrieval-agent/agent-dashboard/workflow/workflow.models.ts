import { ComponentRef } from '@angular/core';
import {
  AnswerOperation,
  AragModule,
  AskAgent,
  AskAgentCreation,
  BaseAliniaAgentCreation,
  BaseContextAgent,
  BaseGenerationAgent,
  BasePostprocessAgent,
  BasePreprocessAgent,
  BasicAskAgent,
  BasicAskAgentCreation,
  BraveAgent,
  BraveAgentCreation,
  ContextAgentCreation,
  ExternalAgent,
  ExternalAgentCreation,
  GenerationAgentCreation,
  GoogleAgent,
  GoogleAgentCreation,
  GuardrailsProviderType,
  InternetProviderType,
  McpAgentCreation,
  Memory,
  PerplexityAgent,
  PerplexityAgentCreation,
  PostprocessAliniaAgent as PostAliniaAgent,
  PostprocessAliniaCreation as PostAliniaCreation,
  PostprocessAgentCreation,
  PreprocessAliniaAgent as PreAliniaAgent,
  PreprocessAliniaCreation as PreAliniaCreation,
  PreprocessAgentCreation,
  RephraseAgent,
  RephraseAgentCreation,
  SqlAgent,
  SqlAgentCreation,
  TavilyAgent,
  TavilyAgentCreation,
} from '@nuclia/core';
import { ConnectableEntryComponent, NodeDirective } from './basic-elements';

export interface WorkflowRoot {
  preprocess: ConnectableEntryComponent;
  context: ConnectableEntryComponent;
  generation: ConnectableEntryComponent;
  postprocess: ConnectableEntryComponent;
}

export type NodeType =
  | 'historical'
  | 'rephrase'
  | 'pre_conditional'
  | 'preprocess_alinia'
  | 'context_conditional'
  | 'basic_ask'
  | 'ask'
  | 'advanced_ask'
  | 'internet'
  | 'sql'
  | 'cypher'
  | 'mcp'
  | 'restricted'
  | 'summarize'
  | 'generate'
  | 'post_conditional'
  | 'remi'
  | 'external'
  | 'restart'
  | 'postprocess_alinia';

const INTERNET_PROVIDERS: InternetProviderType[] = ['brave', 'perplexity', 'tavily', 'google'];
export type InternetProvider = (typeof INTERNET_PROVIDERS)[number];

const CONDITIONAL_NODES: NodeType[] = ['pre_conditional', 'context_conditional', 'post_conditional'];
export type CondionalNodeType = (typeof CONDITIONAL_NODES)[number];
export function isCondionalNode(x: any): x is CondionalNodeType {
  return CONDITIONAL_NODES.includes(x);
}

export type NodeCategory = 'preprocess' | 'context' | 'generation' | 'postprocess';
export type NodeState = 'default' | 'unsaved' | 'selected' | 'processing' | 'processed';

const CATEGORY_LIST: NodeCategory[] = ['preprocess', 'context', 'generation', 'postprocess'];
export function isCategory(x: any): x is NodeCategory {
  return CATEGORY_LIST.includes(x);
}

export interface ParentNode {
  nodeRef: ComponentRef<NodeDirective>;
  nodeType: NodeType;
  nodeCategory: NodeCategory;
  isSaved: boolean;
  nodeConfig?: NodeConfig;
  agentId?: string;
  // properties to store the child nodes’ UI id.
  parentId?: string;
  parentLinkType?: string;
  parentLinkConfigProperty?: string;
  then?: string[];
  else?: string[];
  fallback?: string;
  nextAgent?: string;
  // If node is a child, index in the parent then/else list
  childIndex?: number;
}

export const NODE_SELECTOR_ICONS: { [nodeType: string]: string } = {
  ask: 'database',
  basic_ask: 'database',
  brave: 'globe',
  context_conditional: 'dataflow',
  cypher: 'file-code',
  external: 'globe',
  generate: 'generator',
  google: 'globe',
  historical: 'history',
  internet: 'globe',
  mcp: 'file',
  perplexity: 'globe',
  post_conditional: 'dataflow',
  postprocess_alinia: 'shield-check',
  pre_conditional: 'dataflow',
  preprocess_alinia: 'shield-check',
  remi: 'validation',
  rephrase: 'rephrase',
  restart: 'repeat',
  restricted: 'file-code',
  sql: 'file-code',
  summarize: 'summary',
  tavily: 'globe',
};

export interface CommonAgentConfig {
  rules: string[] | null;
}

export interface AragAnswerUi {
  module: AragModule;
  answer: string | null;
  generated_text: string | null;
  steps: Memory.Step[];
  context: Memory.Context | null;
  operation: AnswerOperation;
  seqid: number | null;
}

export type NodeConfig =
  | HistoricalAgentUI
  | RephraseAgentUI
  | PreConditionalAgentUI
  | ContextConditionalAgentUI
  | InternetAgentUI
  | SqlAgentUI
  | CypherAgentUI
  | RestrictedAgentUI
  | McpAgentUI
  | AskAgentUI
  | BasicAskAgentUI
  | SummarizeAgentUI
  | PostConditionalAgentUI
  | RestartAgentUI
  | ExternalAgentUI
  | GuardrailsAgentUI;

export interface HistoricalAgentUI extends CommonAgentConfig {
  all: boolean;
}

export interface RephraseAgentUI extends CommonAgentConfig {
  kb: string;
  extend: boolean;
  synonyms: boolean;
  history: boolean;
  userInfo: boolean;
  split_question: boolean;
  model?: string;
}

export interface InternetAgentUI extends CommonAgentConfig {
  provider: InternetProviderType;
  source: string;
  brave: Omit<BraveAgentCreation, 'module' | 'source'>;
  perplexity: Omit<PerplexityAgentCreation, 'module' | 'source'>;
}

export interface GuardrailsAgentUI extends CommonAgentConfig {
  provider: GuardrailsProviderType;
  category: 'preprocess' | 'postprocess';
  alinia: Omit<CommonAgentConfig, 'rules'> & Omit<BaseAliniaAgentCreation, 'module'>;
}

export interface SqlAgentUI extends CommonAgentConfig {
  source: string;
  prompt?: string;
  retries: number;
  sqlschema?: string | null;
  ignore_tables: string[];
  include_tables: string[];
  sample_rows_in_table_info?: number;
  indexes_in_table_info?: boolean;
  custom_table_info?: { [property: string]: unknown };
  view_support?: boolean;
  max_string_length?: number;
  lazy_table_reflection?: boolean;
}

export interface CypherAgentUI extends CommonAgentConfig {
  source: string;
  exclude_types: string[];
  include_types: string[];
  allow_dangerous_requests: boolean;
  top_k: number;
}

export interface BasicAskAgentUI extends CommonAgentConfig {
  sources: string;
  fallback?: BaseContextAgent | null;
  summarize_model?: string;
  generative_model?: string;
}

export interface AskAgentUI extends CommonAgentConfig {
  sources: string;
  fallback?: BaseContextAgent | null;
  pre_queries?: string[];
  filters?: string[];
  security_groups?: string[];
  rephrase_semantic_custom_prompt?: string;
  rephrase_lexical_custom_prompt?: string;
  keywords_custom_prompt?: string;
  visual_enable_prompt?: string;
  before?: number;
  after?: number;
  extra_fields: string[];
  full_resource: boolean;
  vllm: boolean;
  query_entities?: { name: string; type?: string; subtype?: string }[];
  retrieve_related?: string;
  ai_parameter_search?: boolean;
}

export interface McpAgentUI extends CommonAgentConfig {
  source: string;
  transport: 'SSE' | 'STDIO';
  fallback?: BaseContextAgent | null;
  summarize_model?: string;
  tool_choice_model?: string;
}

export interface BaseConditionalAgentUI extends CommonAgentConfig {
  prompt: string;
  then?: (BasePreprocessAgent | BaseContextAgent | BaseGenerationAgent | BasePostprocessAgent)[];
  else_?: (BasePreprocessAgent | BaseContextAgent | BaseGenerationAgent | BasePostprocessAgent)[];
}
export interface PreConditionalAgentUI extends CommonAgentConfig {
  prompt: string;
  then?: BasePreprocessAgent[];
  else_?: BasePreprocessAgent[];
}
export interface ContextConditionalAgentUI extends CommonAgentConfig {
  prompt: string;
  then?: BaseContextAgent[];
  else_?: BaseContextAgent[];
}
export interface PostConditionalAgentUI extends CommonAgentConfig {
  prompt: string;
  then?: BasePostprocessAgent[];
  else_?: BasePostprocessAgent[];
}

export interface SummarizeAgentUI extends CommonAgentConfig {
  prompt: string;
  images?: boolean;
  conversational?: boolean;
}
export interface GenerateAgentUI extends CommonAgentConfig {
  prompt: string;
  images?: boolean;
  generate_image?: boolean;
}

export interface RestartAgentUI extends CommonAgentConfig {
  prompt: string;
  model: string;
  retries: number;
  rules: string[];
}

export interface ExternalAgentUI extends CommonAgentConfig {
  url: string;
  payload: 'none' | 'context' | 'call_schema' | 'call_obj';
  prompt?: string;
  method?: 'POST' | 'GET' | 'PATCH';
  description?: string;
  call_schema?: string;
  call_obj?: string;
  headers?: { [property: string]: string };
  model?: string;
}

export interface RestrictedAgentUI extends CommonAgentConfig {
  code: string;
}

export function getNodeTypeFromAgent(
  agent: BasePreprocessAgent | BaseContextAgent | BaseGenerationAgent | BasePostprocessAgent,
): NodeType {
  return agent.module as NodeType;
}
export function rephraseUiToCreation(config: RephraseAgentUI): RephraseAgentCreation {
  const { userInfo, model, ...agentConfig } = config;
  return {
    module: 'rephrase',
    ...agentConfig,
    session_info: userInfo,
    rids: [],
    labels: [],
    model: model || undefined, // null is not allowed on model params
  };
}
export function rephraseAgentToUi(agent: RephraseAgent): RephraseAgentUI {
  const { session_info, ...uiConfig } = agent;
  return {
    ...uiConfig,
    userInfo: session_info || false,
    extend: uiConfig.extend || false,
    synonyms: uiConfig.synonyms || false,
    history: uiConfig.history || false,
    split_question: uiConfig.split_question || false,
  };
}
export function askUiToCreation(config: AskAgentUI): AskAgentCreation {
  const { sources, ...agentConfig } = config;
  return {
    module: 'ask',
    sources: sources.split(','),
    ...agentConfig,
  };
}
export function askAgentToUi(agent: AskAgent): AskAgentUI {
  return {
    ...agent,
    sources: agent.sources.join(','),
    rules: agent.rules || null,
  };
}
export function basicAskUiToCreation(config: BasicAskAgentUI): BasicAskAgentCreation {
  const { sources, generative_model, summarize_model, ...agentConfig } = config;
  return {
    module: 'basic_ask',
    sources: Array.isArray(sources) ? sources : sources.split(','),
    // null is not allowed on model params
    generative_model: generative_model || undefined,
    summarize_model: summarize_model || undefined,
    ...agentConfig,
  };
}
export function basicAskAgentToUi(agent: BasicAskAgent): BasicAskAgentUI {
  return {
    ...agent,
    sources: agent.sources.join(','),
    rules: agent.rules || null,
  };
}
export function mcpUiToCreation(config: McpAgentUI): McpAgentCreation {
  const { summarize_model, tool_choice_model, ...agentConfig } = config;
  return {
    module: 'mcp',
    // null is not allowed on model params
    tool_choice_model: tool_choice_model || undefined,
    summarize_model: summarize_model || undefined,
    ...agentConfig,
  };
}
export function sqlUiToCreation(config: SqlAgentUI): SqlAgentCreation {
  const { prompt, ...agentConfig } = config;
  return {
    module: 'sql',
    description: prompt,
    ...agentConfig,
  };
}
export function sqlAgentToUi(agent: SqlAgent): SqlAgentUI {
  const { description, retries, ...uiConfig } = agent;
  return {
    ...uiConfig,
    prompt: description || '',
    retries: retries || 3,
    rules: agent.rules || null,
  };
}
export function externalUiToCreation(config: ExternalAgentUI): ExternalAgentCreation {
  const { payload, call_schema, call_obj, ...agentConfig } = config;
  const context = payload === 'context';
  let formattedCallObj, formattedCallSchema;
  if (payload === 'call_obj' && call_obj) {
    formattedCallObj = JSON.parse(call_obj);
  } else if (payload === 'call_schema' && call_schema) {
    formattedCallSchema = JSON.parse(call_schema);
  }
  return {
    module: 'external',
    context,
    call_schema: formattedCallSchema,
    call_obj: formattedCallObj,
    ...agentConfig,
  };
}
export function externalAgentToUi(agent: ExternalAgent): ExternalAgentUI {
  const { call_schema, call_obj, ...uiConfig } = agent;
  return {
    ...uiConfig,
    payload: agent.context ? 'context' : agent.call_obj ? 'call_obj' : agent.call_schema ? 'call_schema' : 'none',
    rules: agent.rules || null,
    call_schema: JSON.stringify(call_schema),
    call_obj: JSON.stringify(call_obj),
  };
}

export type GuardrailsAgentCreation = PreAliniaCreation | PostAliniaCreation;
export type GuardrailsAgent = PreAliniaAgent | PostAliniaAgent;
export function guardrailsUiToCreation(config: GuardrailsAgentUI): GuardrailsAgentCreation {
  const baseConfig = {
    rules: config.rules,
  };
  switch (config.category) {
    case 'preprocess':
      const preconfig = config.alinia.preconfig;
      if (!(preconfig === 'INAPPROPRIATE' || preconfig === 'CUSTOM')) {
        throw new Error(`Guardrails preconfig ${preconfig} is not allowed for preprocess ${config.provider} agent.`);
      }
      return {
        module: 'preprocess_alinia',
        ...baseConfig,
        ...config.alinia,
        preconfig,
      };
    case 'postprocess':
      return {
        module: 'postprocess_alinia',
        ...baseConfig,
        ...config.alinia,
      };
  }
}
export function guardrailsAgentToUi(agent: GuardrailsAgent): GuardrailsAgentUI {
  return {
    provider: 'alinia', // For now alinia is the only provider available
    category: agent.module.startsWith('preprocess') ? 'preprocess' : 'postprocess',
    rules: agent.rules || null,
    alinia: {
      ...agent,
    },
  };
}

export type InternetAgent = BraveAgent | PerplexityAgent | TavilyAgent | GoogleAgent;
export function getAgentFromConfig(
  nodeType: NodeType,
  config: any,
): PreprocessAgentCreation | ContextAgentCreation | GenerationAgentCreation | PostprocessAgentCreation {
  const cleanConfig = cleanupConfig(config);
  switch (nodeType) {
    case 'rephrase':
      return rephraseUiToCreation(cleanConfig);
    case 'sql':
      return sqlUiToCreation(cleanConfig);
    case 'ask':
      return askUiToCreation(cleanConfig);
    case 'basic_ask':
      return basicAskUiToCreation(cleanConfig);
    case 'mcp':
      return mcpUiToCreation(cleanConfig);
    case 'external':
      return externalUiToCreation(cleanConfig);
    case 'preprocess_alinia':
    case 'postprocess_alinia':
      return guardrailsUiToCreation(cleanConfig);
    default:
      return { module: nodeType, ...cleanConfig };
  }
}

/**
 * Angular form usually send empty string when a field is not set, but the backend is expecting null in that case.
 * So we're changing all empty strings by null in the config
 * @param config Agent configuration
 */
function cleanupConfig(config: any): any {
  if (typeof config === 'object' && !Array.isArray(config)) {
    Object.entries(config).forEach(([key, value]) => {
      if (value === '') {
        config[key] = null;
      } else if (value !== null && typeof value === 'object') {
        config[key] = cleanupConfig(value);
      }
    });
  }
  return config;
}

export function getConfigFromAgent(
  agent: BasePreprocessAgent | BaseContextAgent | BaseGenerationAgent | BasePostprocessAgent,
): NodeConfig {
  switch (agent.module) {
    case 'rephrase':
      return rephraseAgentToUi(agent as RephraseAgent);
    case 'sql':
      return sqlAgentToUi(agent as SqlAgent);
    case 'ask':
      return askAgentToUi(agent as AskAgent);
    case 'basic_ask':
      return basicAskAgentToUi(agent as BasicAskAgent);
    case 'external':
      return externalAgentToUi(agent as ExternalAgent);
    case 'preprocess_alinia':
    case 'postprocess_alinia':
      return guardrailsAgentToUi(agent as GuardrailsAgent);
    default:
      return { ...agent } as any as NodeConfig;
  }
}

export function formatHeaders(extra: { [property: string]: { property: string; value: string } }): {
  [property: string]: string;
} {
  return Object.values(extra).reduce(
    (config, entry) => {
      config[entry.property] = entry.value;
      return config;
    },
    {} as { [property: string]: string },
  );
}

export function formatExtraConfig(extra: { [property: string]: { property: string; value: string } }): {
  [property: string]: string | number | null;
} {
  return Object.values(extra).reduce(
    (config, entry) => {
      const intValue = parseInt(entry.value, 10);
      config[entry.property] = isNaN(intValue) ? entry.value : intValue;
      return config;
    },
    {} as { [property: string]: string | number | null },
  );
}
