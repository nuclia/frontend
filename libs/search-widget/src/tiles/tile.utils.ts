import type { MediaWidgetParagraph } from '../core/models';
import { SHORT_FIELD_TYPE } from '@nuclia/core';

export const markRegex = new RegExp(/<\/*mark>/, 'g');

export function getUnMarked(paragraph: string): string {
  return paragraph.replace(markRegex, '').trim();
}

export const isFileOrLink = (fieldType: string): boolean => {
  return isFile(fieldType) || fieldType === SHORT_FIELD_TYPE.link;
};

export const isFile = (fieldType: string): boolean => {
  return fieldType === SHORT_FIELD_TYPE.file;
};

export const filterParagraphs = (query: string, paragraphs: MediaWidgetParagraph[]): MediaWidgetParagraph[] => {
  return paragraphs
    .filter((paragraph) => paragraph.text.toLocaleLowerCase().includes(query.toLocaleLowerCase()))
    .map((paragraph) => {
      const regexp = new RegExp(query, 'ig');
      return {
        ...paragraph,
        text: paragraph.text.replace(regexp, `<mark>$&</mark>`),
      };
    });
};
