import { ComponentRef } from '@angular/core';
import { NodeDirective } from './basic-elements';

export type NodeType =
  | 'rephrase'
  | 'conditional'
  | 'validation'
  | 'summarize'
  | 'restart'
  | 'nuclia'
  | 'internet'
  | 'sql'
  | 'cypher';

export type EntryType = 'preprocess' | 'context' | 'postprocess' | 'if' | 'then' | 'else';

export interface Node {
  nodeRef: ComponentRef<NodeDirective>;
  nodeType: NodeType;
  nodeConfig?: any;
}

export const NODES_BY_ENTRY_TYPE: { [entry: string]: NodeType[] } = {
  preprocess: ['rephrase'],
  context: ['conditional', 'nuclia', 'internet', 'sql', 'cypher'],
  postprocess: ['validation', 'summarize', 'restart'],
};

export const NODE_SELECTOR_ICONS: { [nodeType: string]: string } = {
  conditional: 'dataflow',
  cypher: 'file-code',
  internet: 'globe',
  nucliaDB: 'database',
  rephrase: 'rephrase',
  restart: 'repeat',
  sql: 'file-code',
  summarize: 'summary',
  validation: 'validation',
};

export interface AgentWorkflow {
  preprocess: RephraseAgent[];
  context: [];
  postprocess: [];
}

export interface RephraseAgent {
  prompt: string;
  kb?: string;
  extend: boolean;
  synonyms: boolean;
  history: boolean;
  userInfo: boolean;
}
