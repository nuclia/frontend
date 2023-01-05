import { FieldType, MediaWidgetParagraph } from '../core/models';

export const markRegex = new RegExp(/<\/*mark>/, 'g');

export function getUnMarked(paragraph: string): string {
  return paragraph.replace(markRegex, '').trim();
}

export const isFileOrLink = (fieldType: string): boolean => {
  return isFile(fieldType) || fieldType === FieldType.LINK;
};

export const isFile = (fieldType: string): boolean => {
  return fieldType === FieldType.FILE;
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
