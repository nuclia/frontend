<script lang="ts">
  import { Search } from '@nuclia/core';
  import { PreviewKind, WidgetParagraph } from '../../core/models';
  import TextViewer from './TextViewer.svelte';
  import DocumentTile from '../base-tile/DocumentTile.svelte';
  import { getCDN } from '../../core/utils';

  export let result: Search.SmartResult;

  let selectedParagraph: WidgetParagraph | undefined;
</script>

<DocumentTile
  previewKind={PreviewKind.NONE}
  fallbackThumbnail={`${getCDN()}icons/text/plain.svg`}
  {result}
  on:selectParagraph={(event) => (selectedParagraph = event.detail.paragraph)}>
  <TextViewer {selectedParagraph} />
</DocumentTile>
