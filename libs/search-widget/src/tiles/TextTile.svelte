<script lang="ts">
  import { Search } from '@nuclia/core';
  import { PreviewKind, WidgetParagraph } from '../core/models';
  import TextViewer from './viewers/TextViewer.svelte';
  import { getCDN } from '../core/utils';
  import { getResourceField } from '../core/api';
  import { fieldData, fieldFullId } from '../core/stores/viewer.store';
  import { filter, switchMap, take } from 'rxjs';
  import DocumentTile from './base-tile/DocumentTile.svelte';

  export let result: Search.SmartResult;

  let selectedParagraph: WidgetParagraph | undefined;
  let isFieldLoaded = false;

  function openParagraph(paragraph: WidgetParagraph) {
    selectedParagraph = paragraph;
    if (!isFieldLoaded) {
      isFieldLoaded = true;
      fieldFullId
        .pipe(
          filter((fullId) => !!fullId),
          take(1),
          switchMap((fullId) => getResourceField(fullId)),
        )
        .subscribe((field) => fieldData.set(field));
    }
  }
</script>

<DocumentTile
  previewKind={PreviewKind.NONE}
  fallbackThumbnail={`${getCDN()}icons/text/plain.svg`}
  {result}
  on:selectParagraph={(event) => openParagraph(event.detail)}>
  <TextViewer {selectedParagraph} />
</DocumentTile>
