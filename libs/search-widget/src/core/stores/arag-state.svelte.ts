import {
  AnswerOperation,
  FIELD_TYPE,
  Memory,
  Search,
  SHORT_FIELD_TYPE,
  shortToLongFieldType,
  type AragAnswer,
  type IErrorResponse,
} from '@nuclia/core';
import { addLLMCitationReferences } from './answers.store';
import type { RankedParagraph, TypedResult } from '../models';
import { getResultType, parseFootenotes } from '.';

type AragSource = SourceChunk | SourceField;

export interface SourceChunk {
  type: 'chunk';
  rank: number;
  value: Memory.Chunk;
}

export interface SourceField {
  type: 'field';
  rank?: number;
  value: TypedResult;
}

type RankedChunk = Memory.Chunk & { rank?: number };

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
export function getEntryVisualizations(entry: AragChatEntry) {
  return entry.answers.filter((a) => !!a.data_visualizations).slice(-1)[0];
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
export function getEntryAnswerText(entry: AragChatEntry) {
  return addLLMCitationReferences(getEntryAnswer(entry)?.answer || '', true);
}

export function getEntrySources(entry: AragChatEntry): AragSource[] {
  const answer = getEntryAnswer(entry);
  if (!answer) {
    return [];
  }
  const blocks = parseFootenotes(answer.answer || '');
  let kbChunks: RankedChunk[] = [];
  let otherChunks: RankedChunk[] = [];
  Object.entries(answer.answer_citations?.metadata || {}).forEach(([block, value]) => {
    const context = entry.answers.find((answer) => answer.context?.id === value.context_id)?.context;
    if (context) {
      const chunks = typeof value.chunk_index === 'number' ? [context.chunks[value.chunk_index]] : context.chunks || [];
      const rank = blocks.find((item) => item.block === block)?.index || 0;
      const rankedChunks = chunks.map((chunk) => ({ ...chunk, rank }));
      const fromAskAgent = ['ask', 'basic_ask', 'advanced_ask'].includes(context.agent);
      if (fromAskAgent) {
        kbChunks = kbChunks.concat(rankedChunks);
      } else {
        otherChunks = otherChunks.concat(rankedChunks);
      }
    }
  });
  kbChunks.sort((a, b) => (a.rank || 0) - (b.rank || 0));
  otherChunks.sort((a, b) => (a.rank || 0) - (b.rank || 0));
  let sources: AragSource[] = convertChunksToResults(kbChunks).map((result) => ({ type: 'field', value: result }));
  sources = sources.concat(otherChunks.map((chunk) => ({ type: 'chunk', rank: chunk.rank || 0, value: chunk })));
  return sources;
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

/**
 * UTILS
 */
function convertChunksToResults(chunks: RankedChunk[]) {
  const chunksGroups = chunks?.reduce(
    (acc, curr) => {
      const fieldId = curr.chunk_id.split('/').slice(0, 3).join('/');
      acc[fieldId] = acc[fieldId] ? acc[fieldId].concat(curr) : [curr];
      return acc;
    },
    {} as { [key: string]: RankedChunk[] },
  );
  return Object.entries(chunksGroups || {}).map(([key, chunks]) => {
    const [resourceId, shortFieldType, fieldId] = key.split('/');
    const fieldType = shortToLongFieldType(shortFieldType as SHORT_FIELD_TYPE);
    const fieldResut: Search.FieldResult = {
      id: resourceId,
      title: chunks[0].title || '',
      field: {
        field_type: fieldType || FIELD_TYPE.text,
        field_id: fieldId,
      },
    };
    const result: TypedResult = {
      ...fieldResut,
      ...getResultType(fieldResut),
      paragraphs: chunks.map((chunk) => convertChunkToParagraph(chunk)),
    };
    return result;
  });
}

export function convertChunkToParagraph(chunk: RankedChunk): RankedParagraph {
  const position = chunk.chunk_id.split('/').pop()?.split('-');
  return {
    order: 0,
    score: 1,
    score_type: Search.FindScoreType.BOTH,
    text: chunk.text,
    id: chunk.chunk_id,
    labels: [],
    position: {
      index: 0,
      start: position?.[0] ? parseInt(position?.[0]) : 0,
      end: position?.[1] ? parseInt(position?.[1]) : 0,
    },
    fuzzy_result: false,
    page_with_visual: false,
    is_a_table: false,
    reference: '',
    rank: chunk.rank,
  };
}
