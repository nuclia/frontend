import { ComponentRef } from '@angular/core';
import {
  AskAgent,
  AskAgentCreation,
  BraveAgent,
  BraveAgentCreation,
  ContextAgent,
  ContextAgentCreation,
  ExternalAgent,
  ExternalAgentCreation,
  GoogleAgent,
  GoogleAgentCreation,
  InternetProviderType,
  PerplexityAgent,
  PerplexityAgentCreation,
  PostprocessAgent,
  PostprocessAgentCreation,
  PreprocessAgent,
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
  postprocess: ConnectableEntryComponent;
}

export type NodeType =
  | 'historical'
  | 'rephrase'
  | 'conditional'
  | 'validation'
  | 'summarize'
  | 'restart'
  | 'ask'
  | 'internet'
  | 'sql'
  | 'cypher'
  | 'remi'
  | 'external'
  | 'restricted'
  | 'mcp';

const INTERNET_PROVIDERS: InternetProviderType[] = ['brave', 'perplexity', 'tavily', 'google'];
export type InternetProvider = (typeof INTERNET_PROVIDERS)[number];
export function isInternetProvider(x: any): x is InternetProvider {
  return INTERNET_PROVIDERS.includes(x);
}
export type NodeCategory = 'preprocess' | 'context' | 'postprocess';

export interface NodeModel {
  nodeRef: ComponentRef<NodeDirective>;
  nodeType: NodeType;
  nodeCategory: NodeCategory;
  nodeConfig?: NodeConfig;
  agent?: PreprocessAgent | ContextAgent | PostprocessAgent;
}

export interface ParentNode extends NodeModel {
  // properties to store the child nodes’ UI id.
  then?: string[];
  else?: string[];
  fallback?: string;
}

export const NODES_BY_ENTRY_TYPE: { [entry: string]: NodeType[] } = {
  preprocess: ['historical', 'rephrase', 'conditional'],
  context: ['conditional', 'ask', 'internet', 'sql', 'cypher', 'restricted', 'mcp'],
  postprocess: ['validation', 'summarize', 'restart', 'conditional', 'remi', 'external'],
};

export const NODE_SELECTOR_ICONS: { [nodeType: string]: string } = {
  ask: 'database',
  conditional: 'dataflow',
  cypher: 'file-code',
  restricted: 'file-code',
  historical: 'history',
  internet: 'globe',
  rephrase: 'rephrase',
  restart: 'repeat',
  sql: 'file-code',
  summarize: 'summary',
  validation: 'validation',
  remi: 'chart',
  external: 'globe',
  mcp: 'file',
};

export interface CommonAgentConfig {
  rules: string[] | null;
}

export type NodeConfig =
  | HistoricalAgentUI
  | RephraseAgentUI
  | InternetAgentUI
  | SqlAgentUI
  | CypherAgentUI
  | AskAgentUI
  | ConditionalAgentUI
  | ValidationAgentUI
  | SummarizeAgentUI
  | RestartAgentUI
  | ExternalAgentUI
  | RestrictedAgentUI
  | McpAgentUI;

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

export interface ConditionalAgentUI extends CommonAgentConfig {
  prompt: string;
}

export interface ValidationAgentUI extends CommonAgentConfig {
  // FIXME: cleanup if Ramon confirm there is no prompt for validation agent
  prompt: string;
}

export interface SummarizeAgentUI extends CommonAgentConfig {
  prompt: string;
  images?: boolean;
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

export function getNodeTypeFromAgent(agent: PreprocessAgent | ContextAgent | PostprocessAgent): NodeType {
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
): PreprocessAgentCreation | ContextAgentCreation | PostprocessAgentCreation {
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
    case 'historical':
    case 'cypher':
    case 'conditional':
    case 'validation':
    case 'summarize':
    case 'restart':
    case 'remi':
    case 'restricted':
    case 'mcp':
      return { module: nodeType, ...config };
  }
}

export function getConfigFromAgent(agent: PreprocessAgent | ContextAgent | PostprocessAgent): NodeConfig {
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
    case 'historical':
    case 'cypher':
    case 'mcp':
    case 'conditional':
    case 'restricted':
    case 'sparql':
    case 'validation':
    case 'summarize':
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
