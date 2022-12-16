export const markRegex = new RegExp(/<\/*mark>/, 'g');

export function getUnMarked(paragraph: string): string {
  return paragraph.replace(markRegex, '').trim();
}
