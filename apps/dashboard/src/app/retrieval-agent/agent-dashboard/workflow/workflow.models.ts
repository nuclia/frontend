export type NodeType = 'rephrase' | 'conditional' | 'validation' | 'summarize' | 'restart';

export type EntryType = 'preprocess' | 'retrieval-context' | 'postprocess' | 'if' | 'then' | 'else';

export const nodesByEntryType: { [entry: string]: NodeType[] } = {
  preprocess: ['rephrase', 'conditional'],
  'retrieval-context': ['conditional'],
  postprocess: ['conditional', 'validation', 'summarize', 'restart'],
};

export const nodeSelectorIcons: { [nodeType: string]: string } = {
  rephrase: 'rephrase',
  conditional: 'dataflow',
  validation: 'validation',
  summarize: 'summary',
  restart: 'repeat',
};
