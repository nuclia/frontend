<script lang="ts">
  import { Search } from '@nuclia/core';
  import { PreviewKind } from '../core/models';
  import { getCDN } from '../core/utils';
  import BaseTile from './base-tile/BaseTile.svelte';
  import SpreadsheetViewer from './viewers/SpreadsheetViewer.svelte';
  import Thumbnail from '../common/thumbnail/Thumbnail.svelte';

  export let result: Search.FieldResult;
  let thumbnailLoaded = false;
</script>

<BaseTile
  previewKind={PreviewKind.NONE}
  typeIndicator="spreadsheet"
  noResultNavigator
  {thumbnailLoaded}
  {result}>
  <span slot="thumbnail">
    <Thumbnail
      src={result.thumbnail}
      fallback={`${getCDN()}icons/text/csv.svg`}
      aspectRatio="5/4"
      on:loaded={() => (thumbnailLoaded = true)} />
  </span>
  <SpreadsheetViewer slot="viewer" />
</BaseTile>
