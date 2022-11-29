import type { Classification } from '@nuclia/core';
import { getFilterFromLabel } from '@nuclia/core';
import { isViewerOpen } from '../../core/stores/modal.store';
import { nucliaStore } from '../../core/old-stores/main.store';
import { typeAhead } from '../../core/stores/suggestions.store';

export function searchBy(label: Classification) {
  isViewerOpen.set(false);
  const labelFilter = getFilterFromLabel(label);
  typeAhead.set('');
  nucliaStore().filters.next([labelFilter]);
  nucliaStore().triggerSearch.next();
}

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
