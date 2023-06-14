import type { Classification } from '@nuclia/core';
import type { LabelSetKind } from '@nuclia/core';

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
