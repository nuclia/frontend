import { viewerState } from '../../core';

export const markRegex = new RegExp(/<\/*mark>/, 'g');

export function getUnMarked(paragraph: string): string {
  return paragraph.replace(markRegex, '').trim();
}

export function unscapeMarkers(text: string) {
  const escapedCitation = /&lt;span class=&quot;ref&quot;&gt;([\d]+)&lt;\/span&gt;/g;
  const matches = text.matchAll(escapedCitation);
  for (const match of matches) {
    text = text.replace(match[0], `<span class="ref">${match[1]}</span>`);
  }
  return text;
};

export function onClosePreview() {
  viewerState.reset();
}
