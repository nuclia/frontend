<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getFile } from '../../core/api';

  export let src: string;
  export let aspectRatio: '5/4' | '16/9' = '5/4';

  let thumbnail: string;
  if (src) {
    getFile(src).subscribe((url) => (thumbnail = url));
  }
  onDestroy(() => {
    if (thumbnail) URL.revokeObjectURL(thumbnail);
  });
</script>

<img src={thumbnail} alt="Thumbnail" style:aspect-ratio="{aspectRatio}" />

<style>
  img {
    width: 100%;
    object-fit: contain;
    object-position: center;
    background-color: #efefef;
  }
</style>
