import type { Classification } from '@nuclia/core';
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

export function getFilterFromLabel(label: Classification) {
  return `/l/${label.labelset}/${label.label}`;
}

export function getLabelFromFilter(filter: string): Classification {
  const items = filter.split('/');
  return { labelset: items[2], label: items[3] };
}
