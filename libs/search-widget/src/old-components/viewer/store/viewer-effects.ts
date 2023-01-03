import type { Subscription } from 'rxjs';
import { concatMap, filter, switchMap, tap } from 'rxjs/operators';
import { getResource, loadEntities } from '../../../core/api';
import type { Resource } from '@nuclia/core';
import { resource } from '../../../core/stores/resource.store';
import { isViewerOpen } from '../../../core/stores/modal.store';
import { formatQueryKey, updateQueryParams } from '../../../core/utils';
import { canEditLabels } from '../../../core/stores/widget.store';
import { initLabelStore } from '../../../core/stores/effects';
import { entityGroups } from '../../../core/stores/entities.store';
import { displayedResource } from '../../../core/stores/search.store';
import type { DisplayedResource } from '../../../core/models';

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
