import { ComponentRef } from '@angular/core';
import {
  AskAgent,
  AskAgentCreation,
  BraveAgent,
  BraveAgentCreation,
  ConditionalAgent,
  ConditionalAgentCreation,
  ContextAgent,
  ContextAgentCreation,
  ContextModule,
  CypherAgent,
  GoogleAgent,
  GoogleAgentCreation,
  HistoricalAgent,
  InternetProviderType,
  PerplexityAgent,
  PerplexityAgentCreation,
  PostprocessAgent,
  PostprocessAgentCreation,
  PostprocessModule,
  PreprocessAgent,
  PreprocessAgentCreation,
  PreprocessModule,
  RephraseAgent,
  RephraseAgentCreation,
  RestrictedAgent,
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
  | 'remi';

const INTERNET_PROVIDERS: InternetProviderType[] = ['brave', 'perplexity', 'tavily', 'google'];
export type InternetProvider = (typeof INTERNET_PROVIDERS)[number];
export function isInternetProvider(x: any): x is InternetProvider {
  return INTERNET_PROVIDERS.includes(x);
}
export type NodeCategory = 'preprocess' | 'context' | 'postprocess';

export interface Node {
  nodeRef: ComponentRef<NodeDirective>;
  nodeType: NodeType;
  nodeCategory: NodeCategory;
  nodeConfig?: NodeConfig;
  agent?: PreprocessAgent | ContextAgent | PostprocessAgent;
  children: Node[];
}

export const NODES_BY_ENTRY_TYPE: { [entry: string]: NodeType[] } = {
  preprocess: ['historical', 'rephrase', 'conditional'],
  context: ['conditional', 'ask', 'internet', 'sql', 'cypher'],
  postprocess: ['conditional', 'validation', 'summarize', 'restart'],
};

export const NODE_SELECTOR_ICONS: { [nodeType: string]: string } = {
  ask: 'database',
  conditional: 'dataflow',
  cypher: 'file-code',
  historical: 'history',
  internet: 'globe',
  rephrase: 'rephrase',
  restart: 'repeat',
  sql: 'file-code',
  summarize: 'summary',
  validation: 'validation',
};

export type NodeConfig =
  | HistoricalAgentUI
  | RephraseAgentUI
  | InternetAgentUI
  | SqlAgentUI
  | CypherAgentUI
  | AskAgentUI
  | ConditionalAgentUI
  | McpAgentUI
  | RestrictedAgentUI
  | SparqlAgentUI
  | ValidationAgentUI
  | SummarizeAgentUI
  | RestartAgentUI;

export type ContextAgentUI =
  | InternetAgentUI
  | SqlAgentUI
  | CypherAgentUI
  | AskAgentUI
  | ConditionalAgentUI
  | McpAgentUI
  | RestrictedAgentUI
  | SparqlAgentUI;
export type PostprocessAgentUI = ValidationAgentUI | SummarizeAgentUI | RestartAgentUI;

export interface NodeConfigUI {
  childRequired?: boolean;
}

export interface HistoricalAgentUI extends NodeConfigUI {
  all: boolean;
}

export interface RephraseAgentUI extends NodeConfigUI {
  prompt: string;
  kb: string;
  extend: boolean;
  synonyms: boolean;
  history: boolean;
  userInfo: boolean;
}

export interface InternetAgentUI extends NodeConfigUI {
  provider: InternetProviderType;
  brave: Omit<BraveAgentCreation, 'module'>;
  perplexity: Omit<PerplexityAgentCreation, 'module'>;
}

export interface SqlAgentUI extends NodeConfigUI {
  source: string;
  prompt?: string;
  retries: number;
}

export interface CypherAgentUI extends NodeConfigUI {
  source: string;
  exclude_types: string[];
  include_types: string[];
  allow_dangerous_requests: boolean;
  top_k: number;
}

export interface AskAgentUI extends NodeConfigUI {
  sources: string;
  rephrase_semantic_custom_prompt?: string;
  rephrase_lexical_custom_prompt?: string;
  keyword_custom_prompt?: string;
  visual_enable_prompt?: string;
  full_resource?: boolean;
  vllm?: boolean;
}

export interface ConditionalAgentUI extends NodeConfigUI {
  prompt: string;
}

export interface RestrictedAgentUI extends NodeConfigUI {
  code: string;
}

export interface McpAgentUI extends NodeConfigUI {}
export interface SparqlAgentUI extends NodeConfigUI {}

export interface ValidationAgentUI extends NodeConfigUI {
  prompt: string;
}

export interface SummarizeAgentUI extends NodeConfigUI {
  prompt: string;
}

export interface RestartAgentUI extends NodeConfigUI {
  prompt: string;
  retries: number;
  rules: string[];
}

export function rephraseUiToCreation(config: RephraseAgentUI): RephraseAgentCreation {
  return {
    module: 'rephrase',
    kb: config.kb,
    extends: config.extend,
    synonyms: config.synonyms,
    session_info: config.userInfo,
    history: config.history,
    rules: [config.prompt],
  };
}
export function rephraseAgentToUi(agent: RephraseAgent): { config: RephraseAgentUI } {
  return {
    config: {
      kb: agent.kb,
      prompt: agent.rules?.[0] || '',
      extend: agent.extends || false,
      synonyms: agent.synonyms || false,
      userInfo: agent.session_info || false,
      history: agent.history || false,
    },
  };
}
export function askUiToCreation(config: AskAgentUI, fallback?: Node): AskAgentCreation {
  const { sources, ...agentConfig } = config;
  // TODO: save fallback
  return {
    module: 'ask',
    sources: sources.split(','),
    ...agentConfig,
  };
}
export function askAgentToUi(agent: AskAgent): { config: AskAgentUI } {
  return {
    config: {
      ...agent,
      sources: agent.sources.join(','),
      childRequired: false,
    },
  };
}
export function conditionalUiToAgent(config: ConditionalAgentUI, then: ContextAgentCreation): ConditionalAgentCreation {
  const { childRequired, ...agentConfig } = config;
  return {
    module: 'conditional',
    ...agentConfig,
    then,
  };
}

export function conditionalAgentToUi(agent: ConditionalAgent): {
  config: ConditionalAgentUI;
  children: { entry: string; agent: ContextAgent }[];
} {
  const children = [{ entry: 'then', agent: agent.then as ContextAgent }];
  if (agent.else) {
    children.push({ entry: 'else', agent: agent.else as ContextAgent });
  }
  return {
    config: {
      ...agent,
      prompt: agent.prompt || '',
    },
    children,
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
export function sqlAgentToUi(agent: SqlAgent): { config: SqlAgentUI } {
  return {
    config: {
      source: agent.source,
      prompt: agent.description || '',
      retries: agent.retries || 3,
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
  switch (config.provider) {
    case 'brave':
      return {
        module: config.provider,
        ...config.brave,
      };
    case 'perplexity':
      return {
        module: config.provider,
        ...config.perplexity,
      };
    case 'tavily':
    case 'google':
      return {
        module: config.provider,
      };
  }
}
export function internetAgentToUi(agent: InternetAgent): { config: InternetAgentUI } {
  return {
    config: {
      provider: agent.module,
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
    },
  };
}

export function getAgentFromConfig(
  nodeType: NodeType,
  config: NodeConfig,
  children: Node[] = [],
): PreprocessAgentCreation | ContextAgentCreation | PostprocessAgentCreation {
  switch (nodeType) {
    case 'rephrase':
      return rephraseUiToCreation(config as RephraseAgentUI);
    case 'internet':
      return internetUiToCreation(config as InternetAgentUI);
    case 'sql':
      return sqlUiToCreation(config as SqlAgentUI);
    case 'ask':
      return askUiToCreation(config as AskAgentUI, children[0]);
    case 'historical':
      return { module: nodeType, ...(config as HistoricalAgentUI) };
    case 'cypher':
      return { module: nodeType, ...(config as CypherAgentUI) } as CypherAgent;
    case 'conditional':
      const child = children[0];
      const childConfig = child.nodeConfig;
      if (!childConfig) {
        throw new Error(`getAgentFromConfig: no config stored for conditional child`);
      }
      const then = getAgentFromConfig(child.nodeType, childConfig);
      return conditionalUiToAgent(config as ConditionalAgentUI, then as ContextAgentCreation);
    case 'validation':
    case 'summarize':
    case 'restart':
    case 'remi':
      return { module: nodeType, ...(config as any) };
  }
}

export function getConfigFromAgent(agent: PreprocessAgent | ContextAgent | PostprocessAgent): {
  config: NodeConfig;
  children?: { entry: string; agent: PreprocessAgent | ContextAgent | PostprocessAgent }[];
} {
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
    case 'conditional':
      return conditionalAgentToUi(agent as ConditionalAgent);
    case 'historical':
      return { config: { ...(agent as HistoricalAgent) } };
    case 'cypher':
      return { config: { ...(agent as CypherAgent) } };
    case 'restricted':
      return { config: { ...(agent as RestrictedAgent) } };
    case 'mcp':
    case 'sparql':
    case 'summarize':
    case 'validation':
    case 'restart':
    case 'remi':
      return { config: { ...agent } as NodeConfig };
  }
}

export function getNodeTypeFromModule(module: PreprocessModule | ContextModule | PostprocessModule): NodeType {
  return isInternetProvider(module) ? 'internet' : (module as NodeType);
}
