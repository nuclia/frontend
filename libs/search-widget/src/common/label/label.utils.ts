import type { Classification } from '@nuclia/core';
import { getFilterFromLabel } from '@nuclia/core';
import { isViewerOpen } from '../../core/stores/modal.store';
import { typeAhead } from '../../core/stores/suggestions.store';
import { searchFilters, searchQuery, triggerSearch } from '../../core/stores/search.store';

export function searchBy(label: Classification, resetSearch = false) {
  isViewerOpen.set(false);
  const labelFilter = getFilterFromLabel(label);
  searchFilters.set([labelFilter]);
  if (resetSearch) {
    typeAhead.set('');
    searchQuery.set('');
  }
  triggerSearch.next();
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
