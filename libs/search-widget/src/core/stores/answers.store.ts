import { sliceUnicode, type Ask, type Citations, type IErrorResponse } from '@nuclia/core';
import { SvelteState } from '../state-lib';
import { showResults } from './search.store';
import DOMPurify from 'dompurify';
import { unscapeMarkers } from '../../components';

interface AnswerState {
  chat: Ask.Entry[];
  currentQuestion: string;
  currentAnswer: Ask.Answer;
  error?: IErrorResponse;
  isStreaming: boolean;
  isSpeechOn: boolean;
  input: string;
  disclaimer?: string;
  notEnoughData: boolean;
  hideAnswer: boolean;
}

const EMPTY_ANSWER = { type: 'answer' as const, text: '', id: '' };
export const answerState = new SvelteState<AnswerState>({
  chat: [],
  currentQuestion: '',
  currentAnswer: EMPTY_ANSWER,
  isStreaming: false,
  isSpeechOn: false,
  input: '',
  notEnoughData: false,
  hideAnswer: false,
});

export const chatInput = answerState.writer<string, string>(
  (state) => state.input,
  (state, value) => ({ ...state, input: value }),
);

export const currentQuestion = answerState.writer<string, { question: string; reset: boolean }>(
  (state) => state.currentQuestion,
  (state, value) => ({
    ...state,
    currentQuestion: value.question,
    chat: value.reset ? [] : state.chat,
    isStreaming: true,
    error: undefined,
    input: '',
  }),
);

export const currentAnswer = answerState.writer<Ask.Answer, Partial<Ask.Answer>>(
  (state) => state.currentAnswer,
  (state, value) => {
    showResults.set(true);
    return {
      ...state,
      currentAnswer: { ...state.currentAnswer, ...value },
      isStreaming: true,
    };
  },
);

export const firstAnswer = answerState.reader((state) =>
  state.chat.length === 0 && state.isStreaming
    ? { ...state.currentAnswer, incomplete: true }
    : state.chat[0]?.answer || EMPTY_ANSWER,
);

export const isReasoning = answerState.reader((state) => !state.currentAnswer.text && !!state.currentAnswer.reasoning);

export const lastFullAnswer = answerState.reader((state) =>
  state.chat.length > 0 && !state.isStreaming ? state.chat[state.chat.length - 1].answer : undefined,
);

export const lastSpeakableFullAnswer = answerState.reader((state) =>
  state.chat.length > 0 && !state.isStreaming && state.isSpeechOn
    ? state.chat[state.chat.length - 1].answer
    : undefined,
);

export const chat = answerState.writer<Ask.Entry[]>(
  (state) =>
    state.isStreaming
      ? [...state.chat, { question: state.currentQuestion, answer: { ...state.currentAnswer, incomplete: true } }]
      : state.chat,
  (state, params) => ({
    ...state,
    chat: params,
  }),
);

export const appendChatEntry = answerState.writer<undefined, { question: string; answer: Ask.Answer }>(
  () => undefined,
  (state, params) => ({
    ...state,
    chat: [
      ...state.chat,
      {
        question: params.question,
        answer: {
          ...params.answer,
          inError: params.answer.inError,
        },
      },
    ],
    currentQuestion: '',
    currentAnswer: EMPTY_ANSWER,
    isStreaming: false,
  }),
);

export const jsonAnswer = answerState.reader<any>((state) => {
  const schema = state.chat[0]?.answer.jsonAnswer;
  // if the schema contains a property "answer", it will be displayed as the answer, so we don't return it in the jsonAnswer schema
  if (typeof schema?.['answer'] === 'string') {
    delete schema['answer'];
  }
  return schema;
});

export const reinitChat = answerState.writer<void, void>(
  () => undefined,
  (state) => ({ ...state, chat: state.chat.slice(0, 1) }),
);

export const resetChat = answerState.writer<void, void>(
  () => undefined,
  (state) => ({ ...state, chat: [] }),
);

export const isStreaming = answerState.reader((state) => state.isStreaming);

export const isSpeechOn = answerState.writer<boolean, { value?: boolean; toggle?: boolean }>(
  (state) => state.isSpeechOn,
  (state, params) => ({ ...state, isSpeechOn: params.toggle ? !state.isSpeechOn : !!params.value }),
);

export const chatError = answerState.writer<IErrorResponse | undefined>(
  (state) => state.error,
  (state, error) => {
    showResults.set(true);
    return {
      ...state,
      error,
    };
  },
);

export const hasChatEntries = answerState.reader<boolean>((state) => state.chat.length > 0);

export const disclaimer = answerState.writer<string | undefined, string | undefined>(
  (state) => state.disclaimer,
  (state, value) => ({ ...state, disclaimer: value }),
);

export const hasNotEnoughData = answerState.writer<boolean, boolean>(
  (state) => state.notEnoughData,
  (state, param) => ({ ...state, notEnoughData: param }),
);

export const hideAnswer = answerState.writer<boolean, boolean>(
  (state) => state.hideAnswer,
  (state, param) => ({ ...state, hideAnswer: param }),
);

export function markdownToHTML(markdown: string, markers: boolean) {
  let html = marked.parse(markdown.trim(), { mangle: false, headerIds: false });
  if (markers) {
    // marked.js escapes citation markers within <code> elements by default.
    // This behavior is reverted to correctly display the markers.
    html = unscapeMarkers(html);
  }
  return DOMPurify.sanitize(html);
}

const TABLE_BORDER = new RegExp(/^[-|]+$/);

export function addReferences(answer: Partial<Ask.Answer>, html: boolean) {
  if (answer.citations) {
    return addCitationReferences(answer.text || '', answer.citations, html);
  } else if (answer.citation_footnote_to_context) {
    return addLLMCitationReferences(answer.text || '', html);
  } else {
    return answer.text || '';
  }
}

function addCitationReferences(rawText: string, citations: Citations, html: boolean) {
  Object.values(citations)
    .reduce(
      (acc, curr, index) => [...acc, ...curr.map(([, end]) => ({ index, end }))],
      [] as { index: number; end: number }[],
    )
    .sort((a, b) => (a.end - b.end !== 0 ? a.end - b.end : a.index - b.index))
    .reverse()
    .forEach((ref) => {
      let before = sliceUnicode(rawText, 0, ref.end);
      let after = sliceUnicode(rawText, ref.end);
      const lines = before.split('\n');
      const lastLine = lines[lines.length - 1];
      const lastLineIsTableBorder = TABLE_BORDER.test(lastLine);
      // if the citation marker has been positioned on a table border, we need to move it to the previous line
      // so it does not break the table
      if (lastLineIsTableBorder) {
        before = lines.slice(0, -1).join('\n');
        after = `\n${lastLine}${after}`;
      }
      const lastChar = before.slice(-1);
      // if the citation marker has been positioned after a cell, we need to move it into the cell
      // so it does not break the table
      if (lastChar === '|' || lastChar === '<') {
        before = before.slice(0, -1);
        after = `${lastChar}${after}`;
      }
      rawText = html
        ? `${before}<span class="ref">${ref.index + 1}</span>${after}`
        : `${before}[${ref.index + 1}]${after}`;
    });
  return rawText;
}

const FOOTNOTES_REF = new RegExp(/\[([0-9]+)\]:\sblock-[A-Z]{2}/g);

export function addLLMCitationReferences(rawText: string, html: boolean) {
  const references = rawText.matchAll(FOOTNOTES_REF);
  for (const match of references) {
    const footnoteIndex = match[1];
    rawText = rawText.replace(match[0], '');
    if (html) {
      rawText = rawText.replaceAll(`[${footnoteIndex}]`, `<span class="ref">${footnoteIndex}</span>`);
    }
  }
  return rawText;
}
