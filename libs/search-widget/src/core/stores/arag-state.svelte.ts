import { AnswerOperation, type AragAnswer, type IErrorResponse } from '@nuclia/core';

interface AragAnswerState {
  running: boolean;
  question: string;
  answers: AragAnswer[];
  error?: IErrorResponse;
}

export const aragAnswerState = $state<AragAnswerState>({
  running: false,
  question: '',
  answers: [],
});
export function resetState() {
  aragAnswerState.running = false;
  aragAnswerState.question = '';
  aragAnswerState.answers = [];
}

/**
 * SETTERS
 */
export function setAragQuestion(question: string) {
  resetState();
  aragAnswerState.running = true;
  aragAnswerState.question = question;
}
export function addAragAnswer(answer: AragAnswer) {
  if (answer.operation === AnswerOperation.done) {
    stopAgent();
  } else {
    aragAnswerState.answers.push(answer);
    if (answer.operation === AnswerOperation.error) {
      stopAgent();
    }
  }
}
export function setAragError(error: IErrorResponse) {
  aragAnswerState.error = error;
  stopAgent();
}
export function stopAgent() {
  aragAnswerState.running = false;
}
