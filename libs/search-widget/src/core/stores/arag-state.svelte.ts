import { AnswerOperation, type AragAnswer, type IErrorResponse } from '@nuclia/core';
import { concatMap, delay, from, of } from 'rxjs';
import { messages } from './demo-data';

interface AragAnswerState {
  running: boolean;
  question: string;
  answers: AragAnswer[];
  error?: IErrorResponse;
}

export function fillState() {
  aragAnswerState.running = true;
  from(messages)
    .pipe(concatMap((message) => of(message).pipe(delay(1000))))
    .subscribe((message) => addAragAnswer(message));
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
  aragAnswerState.answers.push(answer);
  if (answer.operation === AnswerOperation.done || answer.operation === AnswerOperation.error) {
    stopAgent();
  }
}
export function setAragError(error: IErrorResponse) {
  aragAnswerState.error = error;
  stopAgent();
}
export function stopAgent() {
  aragAnswerState.running = false;
}
