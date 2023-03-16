import { SvelteState } from '../state-lib';

interface Answer {
  answer: string;
  sources: { resourceId: string; paragraph: string }; // TEMPORARY
}
interface AnswerState {
  dialog: Answer[];
}

export const answerState = new SvelteState<AnswerState>({
  dialog: [],
});
