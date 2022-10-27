<script lang="ts">
  import Modal from '../../common/modal/Modal.svelte';
  import Viewer from '../../old-components/viewer/Viewer.svelte';
  import { isViewerOpen } from '../../core/stores/modal.store';
  import { onMount } from 'svelte';
  import { nucliaState, setDisplayedResource } from '../../core/old-stores/main.store';
  import { concatMap, filter, tap } from 'rxjs/operators';
  import { getResource } from '../../core/api';
  import { Resource } from '@nuclia/core';
  import { resource } from '../../core/stores/resource.store';
  import { formatQueryKey, updateQueryParams } from '../../core/utils';
  import { canEditLabels } from '../../core/stores/widget.store';
  import { activateEditLabelsFeature } from '../../core/stores/effects';
  import { Subscription } from 'rxjs';

  export let permalinkEnabled = false;

  const previewQueryKey = formatQueryKey('preview');
  let subscriptions: Subscription[] = [];

  onMount(() => {
    if (permalinkEnabled) {
      checkUrlParams();
    }

    subscriptions = [
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
    ];
    return () => subscriptions.forEach((subscription) => subscription.unsubscribe());
  });

  const checkUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const uuid = urlParams.get(previewQueryKey);
    if (uuid) {
      setDisplayedResource({ uid: uuid });
    }
  };
</script>

<div class="sw-viewer-modal">
  <Modal
    show={$isViewerOpen}
    on:close={() => isViewerOpen.set(false)}
    closeButton={true}
    --modal-width="var(--resource-modal-width)"
    --modal-width-md="var(--resource-modal-width-md)"
    --modal-height="var(--resource-modal-height)"
    --modal-height-md="var(--resource-modal-height-md)"
  >
    <Viewer />
  </Modal>
</div>
