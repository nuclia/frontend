<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { getFile } from '../../core/api';
  import { fade } from 'svelte/transition';

  export let src: string;
  export let aspectRatio: '5/4' | '16/9' = '5/4';
  export let noBackground = false;

  let loaded = false;

  const dispatch = createEventDispatcher();

  let thumbnail: string;
  if (src) {
    getFile(src).subscribe((url) => {
      thumbnail = url;
      loaded = true;
      dispatch('loaded');
    });
  }
  onDestroy(() => {
    if (thumbnail) URL.revokeObjectURL(thumbnail);
  });
</script>

<div class="sw-thumbnail">
  {#if loaded}
    <img
      in:fade={{ duration: 240 }}
      src={thumbnail}
      alt="Thumbnail"
      style:aspect-ratio={aspectRatio}
      class:thumbnail-background={!noBackground}
    />
  {/if}
  {#if !loaded}
    <div in:fade={{ duration: 160 }} class:thumbnail-background={!noBackground} class="thumbnail-placeholder" />
  {/if}
</div>

<style lang="scss" src="./Thumbnail.scss"></style>
