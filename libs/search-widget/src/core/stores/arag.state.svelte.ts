import { AnswerOperation, type AragAnswer, type IErrorResponse } from '@nuclia/core';

interface AragAnswerState {
  running: boolean;
  question: string;
  answers: AragAnswer[];
  error?: IErrorResponse;
}

const answerState = $state<AragAnswerState>({
  running: false,
  question: '',
  answers: [],
});
function resetState() {
  answerState.running = false;
  answerState.question = '';
  answerState.answers = [];
}

const aragQuestion = $derived(answerState.question);
const aragAnswers = $derived(answerState.answers);

export function getAragQuestion() {
  return aragQuestion;
}
export function getAragAnswers() {
  return aragAnswers;
}
export function setAragQuestion(question: string) {
  resetState();
  answerState.running = true;
  answerState.question = question;
}
export function addAragAnswer(answer: AragAnswer) {
  answerState.answers.push(answer);
  if (answer.operation === AnswerOperation.done || answer.operation === AnswerOperation.error) {
    stopAgent();
  }
}
export function setAragError(error: IErrorResponse) {
  answerState.error = error;
  stopAgent();
}
export function stopAgent() {
  answerState.running === false;
}
