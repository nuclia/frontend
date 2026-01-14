import { AnswerOperation, type AragAnswer, type IErrorResponse } from '@nuclia/core';

interface AragChatEntry {
  running: boolean;
  question: string;
  answers: AragAnswer[];
  error?: IErrorResponse;
}

interface AragAnswerState {
  entries: AragChatEntry[];
  running: boolean;
  question: string;
  answers: AragAnswer[];
  error?: IErrorResponse;
}

export const aragAnswerState = $state<AragAnswerState>({
  entries: [],
  running: false,
  question: '',
  answers: [],
});
export function getCurrentEntry() {
  return aragAnswerState.entries.slice(-1)[0] || {};
}
export function getPreviousEntries() {
  return aragAnswerState.entries.slice(0, -1);
}
/**
 * SETTERS
 */
export function setAragQuestion(question: string) {
  aragAnswerState.entries.push({ running: true, question, answers: [] });
}
export function addAragAnswer(answer: AragAnswer) {
  if (answer.operation === AnswerOperation.done) {
    stopAgent();
  } else {
    const current = aragAnswerState.entries.slice(-1)[0];
    if (current) {
      current.answers.push(answer);
    }
    if (answer.operation === AnswerOperation.error) {
      stopAgent();
    }
  }
}
export function setAragError(error: IErrorResponse) {
  const current = aragAnswerState.entries.slice(-1)[0];
  if (current) {
    current.error = error;
  }
  stopAgent();
}
export function stopAgent() {
  const current = aragAnswerState.entries.slice(-1)[0];
  if (current) {
    current.running = false;
  }
}
