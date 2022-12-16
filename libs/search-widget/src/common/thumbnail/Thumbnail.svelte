<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { getFile } from '../../core/api';

  export let src: string;
  export let fallback = '';
  export let aspectRatio: '5/4' | '16/9' = '5/4';
  export let noBackground = false;

  let loaded = false;

  const dispatch = createEventDispatcher();

  let thumbnail: string;

  onMount(() => {
    if (src) {
      getFile(src).subscribe((url) => {
        thumbnail = url;
        loaded = true;
        dispatch('loaded');
      });
    } else if (fallback) {
      thumbnail = fallback;
      loaded = true;
      dispatch('loaded');
    }
  });

  onDestroy(() => {
    if (thumbnail) URL.revokeObjectURL(thumbnail);
  });
</script>

<div
  class="sw-thumbnail"
  class:thumbnail-background={!noBackground}
  class:thumbnail-fallback={!src && !!fallback}>
  {#if loaded}
    <img
      src={thumbnail}
      alt="Thumbnail"
      style:aspect-ratio={aspectRatio}
      class="fade-in" />
  {/if}
  {#if !loaded}
    <div
      class:thumbnail-background={!noBackground}
      class="thumbnail-placeholder fade-in" />
  {/if}
</div>

<style
  lang="scss"
  src="./Thumbnail.scss"></style>
