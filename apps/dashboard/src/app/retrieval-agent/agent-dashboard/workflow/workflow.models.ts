import { ComponentRef } from '@angular/core';
import { ContextAgent, PostprocessAgent, PreprocessAgent, RephraseAgent, RephraseAgentCreation } from '@nuclia/core';
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
  | 'cypher';

export type EntryType = 'preprocess' | 'context' | 'postprocess';

export interface Node {
  nodeRef: ComponentRef<NodeDirective>;
  nodeType: NodeType;
  nodeConfig?: any;
  agent?: PreprocessAgent | ContextAgent | PostprocessAgent;
}

export const NODES_BY_ENTRY_TYPE: { [entry: string]: NodeType[] } = {
  preprocess: ['historical', 'rephrase'],
  context: ['conditional', 'ask', 'internet', 'sql', 'cypher'],
  postprocess: ['validation', 'summarize', 'restart'],
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
