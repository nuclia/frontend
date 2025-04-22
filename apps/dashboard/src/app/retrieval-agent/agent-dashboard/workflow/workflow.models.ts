import { ComponentRef } from '@angular/core';
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

export interface AgentWorkflow {
  preprocess: RephraseAgent[];
  context: ConditionalAgent[];
  postprocess: (ValidationAgent | SummarizeAgent | RestartAgent)[];
}

export interface RephraseAgent {
  prompt: string;
  kb?: string;
  extend: boolean;
  synonyms: boolean;
  history: boolean;
  userInfo: boolean;
}

export interface ConditionalAgent {
  prompt: string;
}

export interface ValidationAgent {
  prompt: string;
}

export interface SummarizeAgent {
  prompt: string;
}

export interface RestartAgent {
  prompt: string;
  retries: number;
  rules: string[];
}
