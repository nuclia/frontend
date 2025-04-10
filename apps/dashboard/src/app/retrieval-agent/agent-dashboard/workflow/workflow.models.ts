export type NodeType =
  | 'rephrase'
  | 'conditional'
  | 'validation'
  | 'summarize'
  | 'restart'
  | 'nucliaDB'
  | 'internet'
  | 'sql'
  | 'cypher';

export type EntryType = 'preprocess' | 'context' | 'postprocess' | 'if' | 'then' | 'else';

export const nodesByEntryType: { [entry: string]: NodeType[] } = {
  preprocess: ['rephrase'],
  context: ['conditional', 'nucliaDB', 'internet', 'sql', 'cypher'],
  postprocess: ['conditional', 'validation', 'summarize', 'restart'],
  then: ['conditional', 'nucliaDB', 'internet', 'sql', 'cypher'],
  else: ['conditional', 'nucliaDB', 'internet', 'sql', 'cypher'],
};

export const nodeSelectorIcons: { [nodeType: string]: string } = {
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

export interface RephraseConfiguration {
  prompt: string;
  extend: boolean;
  askTo?: string;
  synonyms: boolean;
  history: boolean;
  userInfo: boolean;
}
