<script lang="ts">
  import { AudioPlayer } from './players';
  import type { Observable } from 'rxjs';
  import { getFieldUrl, playFrom } from '../../../core';
  import { onDestroy } from 'svelte';

  let mediaLoading = true;
  let mediaTime = 0;
  let mediaUrl: Observable<string> = getFieldUrl();

  const subscription = playFrom.subscribe((time: number) => mediaTime = time);

  onDestroy(() => {
    subscription.unsubscribe();
  });
</script>

{#if $mediaUrl}
  <AudioPlayer
    time={mediaTime}
    src={$mediaUrl}
    on:audioReady={() => (mediaLoading = false)}
    on:error={() => (mediaLoading = false)} />
{/if}
