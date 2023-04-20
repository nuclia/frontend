<script lang="ts">
  import type { Search } from '@nuclia/core';
  import type { MediaWidgetParagraph } from '../../core/models';
  import { PreviewKind } from '../../core/models';
  import BaseTile from './BaseTile.svelte';
  import ThumbnailPlayer from '../../common/thumbnail/ThumbnailPlayer.svelte';
  import { createEventDispatcher } from 'svelte';
  import type { Observable } from 'rxjs';
  import { getFieldUrl } from '../../core/stores/viewer.store';

  export let result: Search.SmartResult;
  export let fallbackThumbnail;
  export let previewKind: PreviewKind.VIDEO | PreviewKind.AUDIO | PreviewKind.YOUTUBE;
  export let mediaLoading = true;

  const dispatch = createEventDispatcher();

  let thumbnailLoaded = false;
  let expanded = false;

  let mediaUrl: Observable<string>;

  function playFromStart() {
    playFrom(0);
  }

  function playParagraph(paragraph: MediaWidgetParagraph) {
    playFrom(paragraph?.start_seconds || 0);
  }

  function playFrom(time: number) {
    dispatch('playFrom', time);

    if (!mediaUrl && result.field) {
      mediaUrl = getFieldUrl();
    }
  }

  function onSelectParagraph(event) {
    playParagraph(event.detail);
    expanded = true;

    if (!mediaUrl && result.field) {
      mediaUrl = getFieldUrl();
    }
  }
</script>

<BaseTile
  {previewKind}
  {result}
  thumbnailLoaded={thumbnailLoaded || !mediaLoading}
  loading={mediaLoading}
  typeIndicator={previewKind === PreviewKind.AUDIO ? 'audio' : 'video'}
  noResultNavigator={true}
  on:selectParagraph={onSelectParagraph}
  on:close={() => (expanded = false)}>
  <span slot="thumbnail">
    <ThumbnailPlayer
      thumbnail={result.thumbnail}
      fallback={fallbackThumbnail}
      spinner={expanded && mediaLoading}
      hasBackground={!result.thumbnail}
      aspectRatio={expanded ? '16/9' : '5/4'}
      on:loaded={() => (thumbnailLoaded = true)}
      on:play={playFromStart} />
  </span>
  <slot slot="viewer" />
</BaseTile>
