import type { Classification } from '@nuclia/core';
import { LabelSetKind } from '@nuclia/core';

let target;
export function getParentLiRect(event: any): DOMRect | null {
  target = event.currentTarget as HTMLElement;
  if (!!target && target.tagName === 'LI') {
    return target.getBoundingClientRect();
  } else if (target.parentElement) {
    return getParentLiRect(target.parentElement);
  } else {
    return null;
  }
}

export interface LabelFilter {
  classification: Classification;
  kind: LabelSetKind;
}
export function isTitleOnly(query: string, labelFilters: LabelFilter[]): boolean {
  return !query && labelFilters.every((labelFilter) => labelFilter.kind === LabelSetKind.RESOURCES);
}
