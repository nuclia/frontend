<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getFile } from '../../core/api';

  export let src: string;
  export let aspectRatio: '5/4' | '16/9' = '5/4';
  export let noBackground = false;

  let thumbnail: string;
  if (src) {
    getFile(src).subscribe((url) => (thumbnail = url));
  }
  onDestroy(() => {
    if (thumbnail) URL.revokeObjectURL(thumbnail);
  });
</script>

<img src={thumbnail} alt="Thumbnail"
     style:aspect-ratio="{aspectRatio}"
     class:thumbnail-background={!noBackground}
/>

<style>
  img {
    width: 100%;
    object-fit: contain;
    object-position: center;
  }

  img.thumbnail-background {
    background-color: var(--color-neutral-lighter);
  }
</style>
