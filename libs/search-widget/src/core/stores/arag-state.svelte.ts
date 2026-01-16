import { AnswerOperation, type AragAnswer, type IErrorResponse } from '@nuclia/core';

export interface AragChatEntry {
  running: boolean;
  question: string;
  answers: AragAnswer[];
  error?: IErrorResponse;
}

interface AragAnswerState {
  entries: AragChatEntry[];
}

export const aragAnswerState = $state<AragAnswerState>({
  entries: [],
});

export function getCurrentEntry(): AragChatEntry | undefined {
  return aragAnswerState.entries.slice(-1)[0];
}
export function getEntryAnswer(entry: AragChatEntry) {
  return entry.answers.filter((a) => !!a.answer).slice(-1)[0];
}
export function getEntryDetails(entry: AragChatEntry) {
  return (
    entry.answers
      .filter((message) => !!message.context || !!message.step)
      .map((message) => {
        if (message.context) {
          return {
            title: message.context.title || '',
            value: message.context.question || '',
            message: message.context.summary ? `Summary: ${message.context.summary}` : '',
          };
        } else {
          return {
            title: message.step?.title || '',
            value: message.step?.value || '',
            message: message.step?.reason ? `Reason: ${message.step.reason}` : '',
          };
        }
      }) || []
  );
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

export function resetState() {
  aragAnswerState.entries = [];
}
