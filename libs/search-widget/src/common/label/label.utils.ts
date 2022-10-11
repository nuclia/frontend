import type { Classification } from '@nuclia/core';
import { isViewerOpen } from '../../core/stores/modal.store';
import { nucliaStore } from '../../core/old-stores/main.store';
import { typeAhead } from '../../core/stores/suggestions.store';

export const labelRegexp = new RegExp(/LABEL=\{([^/]+\/[^}]+)}/);

export function searchBy(label: Classification) {
  isViewerOpen.set(false);
  const labelFilter = `LABEL={${label.labelset}/${label.label}}`;
  typeAhead.set(labelFilter);
  nucliaStore().query.next(labelFilter);
  nucliaStore().triggerSearch.next();
}
