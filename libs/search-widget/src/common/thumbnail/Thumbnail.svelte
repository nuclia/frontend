<script lang="ts">
  import { createEventDispatcher, onDestroy, onMount } from 'svelte';
  import { getFile } from '../../core';
  import { Icon } from '../icons';

  interface Props {
    src: string | undefined;
    fallback?: string;
    aspectRatio?: '5/4' | '16/9';
    noBackground?: boolean;
    clickable?: boolean;
  }

  let { src, fallback = '', aspectRatio = '5/4', noBackground = false, clickable = false }: Props = $props();

  let loaded = $state(false);

  const dispatch = createEventDispatcher();

  let thumbnail: string = $state();

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
  class:thumbnail-fallback={!src && !!fallback}
  class:clickable
  onclick={() => clickable && dispatch('click')}>
  {#if loaded}
    {#if !src}
      <Icon
        name={fallback}
        size="large" />
    {:else}
      <img
        src={thumbnail}
        alt="Thumbnail"
        style:aspect-ratio={aspectRatio}
        class="fade-in" />
    {/if}
  {/if}
  {#if !loaded}
    <div
      class:thumbnail-background={!noBackground}
      class="thumbnail-placeholder fade-in">
    </div>
  {/if}
</div>

<style
  lang="scss"
  src="./Thumbnail.scss"></style>
