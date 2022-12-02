import type { Subscription } from 'rxjs';
import { nucliaState, setDisplayedResource } from './main.store';
import { concatMap, filter, switchMap, tap } from 'rxjs/operators';
import { getResource, loadEntities } from '../api';
import type { Resource } from '@nuclia/core';
import { resource } from '../stores/resource.store';
import { isViewerOpen } from '../stores/modal.store';
import { formatQueryKey, updateQueryParams } from '../utils';
import { canEditLabels } from '../stores/widget.store';
import { activateEditLabelsFeature } from '../stores/effects';
import { entityGroups } from '../../core/stores/entities.store';

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
      nucliaState()
        .displayedResource.pipe(
          filter((displayedResource) => !!displayedResource?.uid),
          concatMap((displayedResource) => getResource(displayedResource.uid)),
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
          activateEditLabelsFeature();
        }
      }),
      isViewerOpen.subscribe((isOpen) => {
        if (!isOpen) {
          setDisplayedResource({ uid: '' });
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get(previewQueryKey)) {
            urlParams.delete(previewQueryKey);
            updateQueryParams(urlParams);
          }
        }
      }),
      nucliaState()
        .displayedResource.pipe(
          filter((displayedResource) => !!displayedResource?.uid),
          switchMap(() => loadEntities()),
        )
        .subscribe((entities) => {
          entityGroups.set(entities);
        }),
    ],
  );
}

const checkUrlParams = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const uuid = urlParams.get(previewQueryKey);
  if (uuid) {
    setDisplayedResource({ uid: uuid });
  }
};
