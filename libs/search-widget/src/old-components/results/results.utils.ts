import type { IResource } from '@nuclia/core';
import type { DisplayedResource } from '../../core/models';
import { navigateToLink } from '../../core/stores/widget.store';
import { goToUrl, isYoutubeUrl } from '../../core/utils';
import { nucliaStore, setDisplayedResource } from '../../core/old-stores/main.store';
import { combineLatest, take, map } from 'rxjs';

export const goToResource = (params: DisplayedResource, text?: string) => {
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
        const uri = linkField.value.uri;
        const isYoutubeLink = isYoutubeUrl(uri);
        goToUrl(uri, text && !isYoutubeLink ? text : undefined);
      } else {
        setDisplayedResource(params);
      }
    });
};
