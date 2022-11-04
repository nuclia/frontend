import type { IResource } from '@nuclia/core';
import type { DisplayedResource } from '../../core/models';
import { navigateToLink } from '../../core/stores/widget.store';
import { goToUrl } from '../../core/utils';
import { nucliaStore, setDisplayedResource } from '../../core/old-stores/main.store';
import { combineLatest, take, map } from 'rxjs';

export const goToResource = (params: DisplayedResource) => {
  combineLatest([
    navigateToLink,
    nucliaStore().searchResults.pipe(
      map((results) => (Object.values(results.resources || {}) as IResource[]).find((r) => r.id === params.uid)),
    ),
  ])
    .pipe(take(1))
    .subscribe(([navigateToLink, resource]) => {
      const linkField = Object.values(resource?.data?.links || {})[0];
      if (navigateToLink && linkField?.value?.uri) {
        goToUrl(linkField.value.uri);
      } else {
        setDisplayedResource(params);
      }
    });
};
