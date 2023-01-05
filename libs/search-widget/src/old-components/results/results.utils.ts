import type { IResource } from '@nuclia/core';
import type { DisplayedResource } from '../../core/models';
import { navigateToLink } from '../../core/stores/widget.store';
import { getExternalUrl, goToUrl, isYoutubeUrl } from '../../core/utils';
import { combineLatest, map, take } from 'rxjs';
import { displayedResource, searchResults } from '../../core/stores/search.store';

export const goToResource = (params: DisplayedResource, text?: string) => {
  combineLatest([
    navigateToLink,
    searchResults.pipe(
      map((results) => (Object.values(results.resources || {}) as IResource[]).find((r) => r.id === params.uid)),
    ),
  ])
    .pipe(take(1))
    .subscribe(([navigateToLink, resource]) => {
      const url = getExternalUrl(resource!);
      if (navigateToLink && url && !isYoutubeUrl(url)) {
        goToUrl(url, text);
      } else {
        displayedResource.set(params);
      }
    });
};
