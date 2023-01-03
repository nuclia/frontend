import type { Subscription } from 'rxjs';
import { concatMap, filter, switchMap, tap } from 'rxjs/operators';
import { getResource, loadEntities } from '../api';
import type { Resource } from '@nuclia/core';
import { resource } from './resource.store';
import { isViewerOpen } from './modal.store';
import { formatQueryKey, updateQueryParams } from '../utils';
import { canEditLabels } from './widget.store';
import { initLabelStore } from './effects';
import { entityGroups } from './entities.store';
import { displayedResource } from './search.store';
import type { DisplayedResource } from '../models';

const subscriptions: Subscription[] = [];
const previewQueryKey = formatQueryKey('preview');

export function unsubscribeViewerEffects() {
  subscriptions.forEach((subscription) => subscription.unsubscribe());
}

export function initViewerEffects(permalinkEnabled: boolean | undefined) {
  if (permalinkEnabled) {
    checkUrlParams();
  }
  subscriptions.push(
    ...[
      displayedResource
        .pipe(
          filter((displayedResource) => !!displayedResource),
          concatMap((displayedResource) => getResource((displayedResource as DisplayedResource).uid)),
          tap((res: Resource) => resource.set(res)),
        )
        .subscribe((res) => {
          isViewerOpen.set(true);
          if (permalinkEnabled) {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get(previewQueryKey) !== res.uuid) {
              urlParams.set(previewQueryKey, res.uuid);
              updateQueryParams(urlParams);
            }
          }
        }),
      canEditLabels.subscribe((canEditLabels) => {
        if (canEditLabels) {
          initLabelStore();
        }
      }),
      isViewerOpen.subscribe((isOpen) => {
        if (!isOpen) {
          displayedResource.set(null);
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get(previewQueryKey)) {
            urlParams.delete(previewQueryKey);
            updateQueryParams(urlParams);
          }
        }
      }),
      displayedResource.pipe(switchMap(() => loadEntities())).subscribe((entities) => entityGroups.set(entities)),
    ],
  );
}

const checkUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const uuid = urlParams.get(previewQueryKey);
  if (uuid) {
    displayedResource.set({ uid: uuid });
  }
};
