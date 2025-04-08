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

export type EntryType = 'preprocess' | 'retrieval-context' | 'postprocess' | 'if' | 'then' | 'else';

export const nodesByEntryType: { [entry: string]: NodeType[] } = {
  preprocess: ['rephrase'],
  'retrieval-context': ['conditional', 'nucliaDB', 'internet', 'sql', 'cypher'],
  postprocess: ['conditional', 'validation', 'summarize', 'restart'],
  then: ['conditional', 'nucliaDB', 'internet', 'sql', 'cypher'],
  else: ['conditional', 'nucliaDB', 'internet', 'sql', 'cypher'],
};

export const nodeSelectorIcons: { [nodeType: string]: string } = {
  rephrase: 'rephrase',
  conditional: 'dataflow',
  validation: 'validation',
  summarize: 'summary',
  restart: 'repeat',
};
