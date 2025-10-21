import { IErrorResponse } from '../../models';
import { AragModule } from './retrieval-agent.types';

export enum Operation {
  start = 0,
  stop = 1,
}

export enum InteractionOperation {
  question = 0,
  quit = 1,
}

export enum AnswerOperation {
  answer = 0,
  start = 2,
  done = 3,
  error = 4,
  agent_request = 5,
}

export interface InteractionRequest {
  question: string;
  headers: Record<string, string>;
  operation: InteractionOperation;
}

export interface ARAGException {
  detail: string;
}

export interface ValidationFeedbackSchema {
  call_tool: boolean;
}

export interface PromptFeedbackSchema {
  prompt_id: string;
  data: any;
}

export interface Feedback {
  request_id: string;
  feedback_id: string;
  question: string;
  module: string;
  agent_id: string;
  data: any;
  timeout_ms: number;
  response_schema: any;
}

export interface AragResponse {
  type: 'answer';
  answer: AragAnswer;
}

export interface AragAnswer {
  exception: ARAGException | null;
  answer: string | null;
  agent_request: string | null;
  generated_text: string | null;
  step: Step | null;
  possible_answer: Answer | null;
  context: Context | null;
  operation: AnswerOperation;
  seqid: number | null;
  original_question_uuid: string | null;
  actual_question_uuid: string | null;
  feedback: Feedback | null;
}

// Memory Models
export interface Metadata {
  // TODO: Define based on actual usage
}

export interface KnowledgeGraph {
  // TODO: Define based on actual usage
}

export interface Reason {
  // TODO: Define based on actual usage
}

export interface NucliaDBMemoryConfig {
  key?: string | null;
  url: string;
  kbid: string;
  internal: boolean;
}

export interface MemoryConfig {
  nucliadb?: NucliaDBMemoryConfig | null;
}

export interface Rule {
  prompt?: string | null;
}

export interface Rules {
  rules: (Rule | string)[];
}

export interface Facets {
  chunks: Record<string, number>;
  fields: Record<string, number>;
}

export interface Source {
  id: string;
  description: string;
  labels: Record<string, string[]>;
  facets_native: any; // CatalogFacetsResponse - TODO: Define this type
  paragraph_facets: Record<string, number>;
  learning_configuration: any; // StoredLearningConfiguration - TODO: Define this type
}

export interface Answer {
  answer: string;
  original_question_uuid?: string | null;
  actual_question_uuid?: string | null;
  module: string;
  agent_path: string;
}

export interface ChunkImages {
  table?: string | null;
  chunk?: string | null;
  page?: string | null;
}

export interface HistoryQuestionAnswer {
  question: string;
  answer: string;
}

export interface AragAnswerStep {
  original_question_uuid?: string | null;
  actual_question_uuid?: string | null;
  module: string;
  title: string;
  value?: string | null;
  agent_path: string;
  reason?: string | null;
  timeit: number;
  input_nuclia_tokens?: number | null;
  output_nuclia_tokens?: number | null;
  error?: string | null;
}

// Legacy interfaces - kept for backwards compatibility
export interface AragAnswerChunk {
  chunk_id: string;
  title?: string | null;
  source?: string | null;
  text: string;
  labels: string[];
  url: string[];
}

export interface AragAnswerContext {
  original_question_uuid?: string | null;
  actual_question_uuid?: string | null;
  question: string;
  chunks: Chunk[];
  images: Record<string, any>; // Image type - TODO: Define this type
  structured: string[];
  source: string;
  agent: string;
  summary: string;
  title?: string | null;
  missing?: string | null;
  citations?: Record<string, any> | null;
}

export function mapErrorResponseFromAnswer(message: AragAnswer): IErrorResponse {
  return {
    type: 'error',
    status: AnswerOperation.error,
    detail: message.exception?.detail || '',
    body: message,
  };
}
