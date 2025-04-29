import { ComponentRef } from '@angular/core';
import {
  AskAgent,
  AskAgentCreation,
  BraveAgent,
  BraveAgentCreation,
  ContextAgent,
  GoogleAgent,
  GoogleAgentCreation,
  InternetProviderType,
  PerplexityAgent,
  PerplexityAgentCreation,
  PostprocessAgent,
  PreprocessAgent,
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
  | 'external';

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
  then?: ParentNode[];
  else?: ParentNode[];
  fallback?: ParentNode;
}

export const NODES_BY_ENTRY_TYPE: { [entry: string]: NodeType[] } = {
  preprocess: ['historical', 'rephrase', 'conditional'],
  context: ['conditional', 'ask', 'internet', 'sql', 'cypher'],
  postprocess: ['validation', 'summarize', 'restart', 'conditional'],
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
  | ValidationAgentUI
  | SummarizeAgentUI
  | RestartAgentUI;

export interface HistoricalAgentUI {
  all: boolean;
}

export interface RephraseAgentUI {
  prompt: string;
  kb: string;
  extend: boolean;
  synonyms: boolean;
  history: boolean;
  userInfo: boolean;
}

export interface InternetAgentUI {
  provider: InternetProviderType;
  brave: Omit<BraveAgentCreation, 'module'>;
  perplexity: Omit<PerplexityAgentCreation, 'module'>;
}

export interface SqlAgentUI {
  source: string;
  prompt?: string;
  retries: number;
}

export interface CypherAgentUI {
  source: string;
  exclude_types: string[];
  include_types: string[];
  allow_dangerous_requests: boolean;
  top_k: number;
}

export interface AskAgentUI {
  sources: string;
  rephrase_semantic_custom_prompt?: string;
  rephrase_lexical_custom_prompt?: string;
  keyword_custom_prompt?: string;
  visual_enable_prompt?: string;
  full_resource?: boolean;
  vllm?: boolean;
}

export interface ConditionalAgentUI {
  prompt: string;
}

export interface ValidationAgentUI {
  prompt: string;
}

export interface SummarizeAgentUI {
  prompt: string;
}

export interface RestartAgentUI {
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
export function rephraseAgentToUi(agent: RephraseAgent): RephraseAgentUI {
  return {
    kb: agent.kb,
    prompt: agent.rules?.[0] || '',
    extend: agent.extends || false,
    synonyms: agent.synonyms || false,
    userInfo: agent.session_info || false,
    history: agent.history || false,
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
  return {
    source: agent.source,
    prompt: agent.description || '',
    retries: agent.retries || 3,
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
export function internetAgentToUi(agent: InternetAgent): InternetAgentUI {
  return {
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
  };
}
