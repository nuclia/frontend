import { IErrorResponse } from '../../models';
import { AragModule } from './retrieval-agent.types';

export enum InteractionOperation {
  question = 0,
  quit = 1,
}
export enum AnswerOperation {
  answer = 0,
  quit = 1,
  start = 2,
  done = 3,
  error = 4,
}

export interface AragResponse {
  type: 'answer';
  answer: AragAnswer;
}

export interface AragAnswer {
  exception: { detail: string } | null;
  answer: string | null;
  generated_text: string | null;
  step: AragAnswerStep | null;
  possible_answer: string | null;
  context: AragAnswerContext | null;
  operation: AnswerOperation;
  seqid: number | null;
  original_question_uuid: string | null;
  actual_question_uuid: string | null;
}

export interface AragAnswerStep {
  original_question_uuid: string;
  actual_question_uuid: string;
  module: AragModule | 'router'; // FIXME: remove router once backend will be fixed
  agent_path: string;
  title: string;
  value: string;
  reason: string;
  prompt: string;
  timeit: number;
  input_nuclia_tokens: number;
  output_nuclia_tokens: number;
}

export interface AragAnswerChunk {
  chunk_id: string;
  title: string | null;
  text: string;
  labels: string[];
  url: string[];
}

export interface AragAnswerContext {
  original_question_uuid: string;
  actual_question_uuid: string;
  question: string;
  chunks: AragAnswerChunk[];
  images: unknown;
  structured: unknown[];
  source: string;
  agent: AragModule;
  summary: string;
  answer: string | null;
  title: string;
  missing: unknown;
}

export function mapErrorResponseFromAnswer(message: AragAnswer): IErrorResponse {
  return {
    type: 'error',
    status: AnswerOperation.error,
    detail: message.exception?.detail || '',
    body: message,
  };
}
