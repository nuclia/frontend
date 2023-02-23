<script lang="ts">
  import { Search } from '@nuclia/core';
  import { PreviewKind, WidgetParagraph } from '../core/models';
  import TextViewer from './viewers/TextViewer.svelte';
  import { getCDN } from '../core/utils';
  import DocumentTile from './base-tile/DocumentTile.svelte';

  export let result: Search.SmartResult;

  let selectedParagraph: WidgetParagraph | undefined;
  let isFieldLoaded = false;

  function openParagraph(paragraph: WidgetParagraph) {
    selectedParagraph = paragraph;
  }
</script>

<DocumentTile
  previewKind={PreviewKind.NONE}
  fallbackThumbnail={`${getCDN()}icons/text/plain.svg`}
  {result}
  on:selectParagraph={(event) => openParagraph(event.detail)}>
  <TextViewer {selectedParagraph} />
</DocumentTile>
