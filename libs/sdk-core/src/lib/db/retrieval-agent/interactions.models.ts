import { IErrorResponse } from '../../models';
import { Memory } from './memory.models';

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
  step: Memory.Step | null;
  possible_answer: Memory.Answer | null;
  context: Memory.Context | null;
  operation: AnswerOperation;
  seqid: number | null;
  original_question_uuid: string | null;
  actual_question_uuid: string | null;
  feedback: Feedback | null;
}

export function mapErrorResponseFromAnswer(message: AragAnswer): IErrorResponse {
  return {
    type: 'error',
    status: AnswerOperation.error,
    detail: message.exception?.detail || '',
    body: message,
  };
}
