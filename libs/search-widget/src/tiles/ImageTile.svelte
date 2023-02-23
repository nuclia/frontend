<script lang="ts">
  import { Search } from '@nuclia/core';
  import { PreviewKind } from '../core/models';
  import { getFieldUrl } from '../core/stores/viewer.store';
  import { Observable } from 'rxjs';
  import BaseTile from './base-tile/BaseTile.svelte';
  import ImageViewer from './viewers/ImageViewer.svelte';
  import Thumbnail from '../common/thumbnail/Thumbnail.svelte';

  export let result: Search.SmartResult;

  let thumbnailLoaded = false;
  let imageUrl: Observable<string>;

  function showImage() {
    if (!imageUrl) {
      imageUrl = getFieldUrl();
    }
  }
</script>

<BaseTile
  previewKind={PreviewKind.IMAGE}
  typeIndicator="image"
  noResultNavigator
  {thumbnailLoaded}
  {result}
  on:selectParagraph={() => showImage()}>
  <span slot="thumbnail">
    <Thumbnail
      src={result.thumbnail}
      aspectRatio="5/4"
      on:loaded={() => (thumbnailLoaded = true)} />
  </span>
  <ImageViewer
    slot="viewer"
    src={$imageUrl}
    alt={result.fieldData?.value?.file?.filename || ''} />
</BaseTile>
