import { ComponentRef } from '@angular/core';
import {
  AskAgent,
  AskAgentCreation,
  BaseAliniaAgentCreation,
  BaseContextAgent,
  BaseGenerationAgent,
  BasePostprocessAgent,
  BasePreprocessAgent,
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
  | 'ask'
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
export function isInternetProvider(x: any): x is InternetProvider {
  return INTERNET_PROVIDERS.includes(x);
}

const CONDITIONAL_NODES: NodeType[] = ['pre_conditional', 'context_conditional', 'post_conditional', 'remi'];
export type CondionalNodeType = (typeof CONDITIONAL_NODES)[number];
export function isCondionalNode(x: any): x is CondionalNodeType {
  return CONDITIONAL_NODES.includes(x);
}

export type NodeCategory = 'preprocess' | 'context' | 'generation' | 'postprocess';

export interface ParentNode {
  nodeRef: ComponentRef<NodeDirective>;
  nodeType: NodeType;
  nodeCategory: NodeCategory;
  isSaved: boolean;
  nodeConfig?: NodeConfig;
  agentId?: string;
  // properties to store the child nodes’ UI id.
  parentId?: string;
  then?: string[];
  else?: string[];
  fallback?: string;
  // If node is a child, index in the parent then/else list
  childIndex?: number;
}

export const NODES_BY_ENTRY_TYPE: { [entry: string]: NodeType[] } = {
  preprocess: ['historical', 'rephrase', 'pre_conditional', 'preprocess_alinia'],
  context: ['context_conditional', 'ask', 'internet', 'sql', 'cypher', 'restricted', 'mcp'],
  generation: ['summarize', 'generate'],
  postprocess: ['restart', 'post_conditional', 'remi', 'external', 'postprocess_alinia'],
};

export const NODE_SELECTOR_ICONS: { [nodeType: string]: string } = {
  ask: 'database',
  pre_conditional: 'dataflow',
  context_conditional: 'dataflow',
  post_conditional: 'dataflow',
  cypher: 'file-code',
  restricted: 'file-code',
  historical: 'history',
  internet: 'globe',
  rephrase: 'rephrase',
  restart: 'repeat',
  sql: 'file-code',
  summarize: 'summary',
  generate: 'generator',
  remi: 'validation',
  external: 'globe',
  mcp: 'file',
  preprocess_alinia: 'shield-check',
  postprocess_alinia: 'shield-check',
};

export interface CommonAgentConfig {
  rules: string[] | null;
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
  | SummarizeAgentUI
  | PostConditionalAgentUI
  | RestartAgentUI
  | ExternalAgentUI
  | GuardrailsAgentUI;

export interface HistoricalAgentUI extends CommonAgentConfig {
  all: boolean;
}

export interface RephraseAgentUI extends CommonAgentConfig {
  prompt: string;
  kb: string;
  extend: boolean;
  synonyms: boolean;
  history: boolean;
  userInfo: boolean;
}

export interface InternetAgentUI extends CommonAgentConfig {
  provider: InternetProviderType;
  brave: Omit<CommonAgentConfig, 'rules'> & Omit<BraveAgentCreation, 'module'>;
  perplexity: Omit<CommonAgentConfig, 'rules'> & Omit<PerplexityAgentCreation, 'module'>;
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
}

export interface McpAgentUI extends CommonAgentConfig {
  source: string;
  transport: 'SSE' | 'STDIO';
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
  return isInternetProvider(agent.module) ? 'internet' : (agent.module as NodeType);
}
export function rephraseUiToCreation(config: RephraseAgentUI): RephraseAgentCreation {
  const { prompt, userInfo, ...agentConfig } = config;
  return {
    module: 'rephrase',
    ...agentConfig,
    session_info: userInfo,
    rules: [prompt],
    rids: [],
    labels: [],
  };
}
export function rephraseAgentToUi(agent: RephraseAgent): RephraseAgentUI {
  const { rules, session_info, ...uiConfig } = agent;
  // FIXME: check with ramon rules vs prompt
  return {
    ...uiConfig,
    prompt: rules?.[0] || '',
    userInfo: session_info || false,
    extend: uiConfig.extend || false,
    synonyms: uiConfig.synonyms || false,
    history: uiConfig.history || false,
    rules: null,
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

export type InternetAgentCreation =
  | BraveAgentCreation
  | PerplexityAgentCreation
  | TavilyAgentCreation
  | GoogleAgentCreation;
export type InternetAgent = BraveAgent | PerplexityAgent | TavilyAgent | GoogleAgent;
export function internetUiToCreation(config: InternetAgentUI): InternetAgentCreation {
  const baseConfig = {
    rules: config.rules,
  };
  switch (config.provider) {
    case 'brave':
      return {
        module: config.provider,
        ...baseConfig,
        ...config.brave,
      };
    case 'perplexity':
      return {
        module: config.provider,
        ...baseConfig,
        ...config.perplexity,
      };
    case 'tavily':
    case 'google':
      return {
        module: config.provider,
        ...baseConfig,
      };
  }
}
export function internetAgentToUi(agent: InternetAgent): InternetAgentUI {
  return {
    provider: agent.module,
    rules: agent.rules || null,
    brave: {
      country: agent.module === 'brave' ? agent.country : '',
      domain: agent.module === 'brave' ? agent.domain : '',
    },
    perplexity: {
      domain: agent.module === 'perplexity' ? agent.domain : [''],
      top_k: agent.module === 'perplexity' ? agent.top_k : 0,
      related_questions: agent.module === 'perplexity' ? agent.related_questions : false,
      images: agent.module === 'perplexity' ? agent.images : false,
    },
  };
}
export function getAgentFromConfig(
  nodeType: NodeType,
  config: any,
): PreprocessAgentCreation | ContextAgentCreation | GenerationAgentCreation | PostprocessAgentCreation {
  switch (nodeType) {
    case 'rephrase':
      return rephraseUiToCreation(config);
    case 'internet':
      return internetUiToCreation(config);
    case 'sql':
      return sqlUiToCreation(config);
    case 'ask':
      return askUiToCreation(config);
    case 'external':
      return externalUiToCreation(config);
    case 'preprocess_alinia':
    case 'postprocess_alinia':
      return guardrailsUiToCreation(config);
    case 'historical':
    case 'cypher':
    case 'pre_conditional':
    case 'context_conditional':
    case 'post_conditional':
    case 'summarize':
    case 'generate':
    case 'restart':
    case 'remi':
    case 'restricted':
    case 'mcp':
      return { module: nodeType, ...config };
  }
}

export function getConfigFromAgent(
  agent: BasePreprocessAgent | BaseContextAgent | BaseGenerationAgent | BasePostprocessAgent,
): NodeConfig {
  switch (agent.module) {
    case 'rephrase':
      return rephraseAgentToUi(agent as RephraseAgent);
    case 'brave':
    case 'perplexity':
    case 'tavily':
    case 'google':
      return internetAgentToUi(agent as InternetAgent);
    case 'sql':
      return sqlAgentToUi(agent as SqlAgent);
    case 'ask':
      return askAgentToUi(agent as AskAgent);
    case 'external':
      return externalAgentToUi(agent as ExternalAgent);
    case 'preprocess_alinia':
    case 'postprocess_alinia':
      return guardrailsAgentToUi(agent as GuardrailsAgent);
    case 'historical':
    case 'cypher':
    case 'mcp':
    case 'pre_conditional':
    case 'context_conditional':
    case 'post_conditional':
    case 'restricted':
    case 'sparql':
    case 'summarize':
    case 'generate':
    case 'restart':
    case 'remi':
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
