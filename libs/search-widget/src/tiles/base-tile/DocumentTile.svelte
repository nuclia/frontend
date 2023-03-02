<script lang="ts">
  import type { Search } from '@nuclia/core';
  import { PreviewKind } from '../../core/models';
  import Thumbnail from '../../common/thumbnail/Thumbnail.svelte';
  import BaseTile from './BaseTile.svelte';

  export let result: Search.SmartResult;
  export let fallbackThumbnail;
  export let previewKind: PreviewKind;

  let thumbnailLoaded = false;
</script>

<BaseTile
  {previewKind}
  {result}
  {thumbnailLoaded}
  typeIndicator={previewKind === PreviewKind.PDF ? 'pdf' : 'text'}
  on:selectParagraph>
  <span slot="thumbnail">
    <Thumbnail
      src={result.thumbnail}
      fallback={fallbackThumbnail}
      aspectRatio="5/4"
      on:loaded={() => (thumbnailLoaded = true)} />
  </span>
  <span slot="viewer">
    <slot />
  </span>
</BaseTile>
