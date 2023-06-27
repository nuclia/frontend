<script lang="ts">
  import { Search } from '@nuclia/core';
  import { PreviewKind, WidgetParagraph } from '../core/models';
  import { getCDN } from '../core/utils';
  import ConversationViewer from './viewers/ConversationViewer.svelte';
  import BaseTile from './base-tile/BaseTile.svelte';
  import Thumbnail from '../common/thumbnail/Thumbnail.svelte';

  export let result: Search.FieldResult;
  let thumbnailLoaded = false;
  let selectedParagraph: WidgetParagraph | undefined;

  function openParagraph(paragraph: WidgetParagraph) {
    selectedParagraph = paragraph;
  }
</script>

<BaseTile
  previewKind={PreviewKind.NONE}
  typeIndicator="conv"
  viewerFullHeight={true}
  {thumbnailLoaded}
  on:selectParagraph={(event) => openParagraph(event.detail)}
  {result}>
  <span slot="thumbnail">
    <Thumbnail
      src={result.thumbnail}
      fallback={`${getCDN()}icons/text/plain.svg`}
      aspectRatio="5/4"
      on:loaded={() => (thumbnailLoaded = true)} />
  </span>
  <ConversationViewer
    slot="viewer"
    {selectedParagraph} />
</BaseTile>
