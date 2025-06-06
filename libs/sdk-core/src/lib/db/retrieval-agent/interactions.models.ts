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

export interface AragAnswer {
  exception: { detail: string };
  answer: string | null;
  generated_text: string | null;
  step: AragAnswerStep | null;
  context: AragAnswerContext | null;
  operation: AnswerOperation;
  seqid: number | null;
}

export interface AragAnswerStep {
  original_question_uuid: string;
  actual_question_uuid: string;
  module: AragModule;
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
