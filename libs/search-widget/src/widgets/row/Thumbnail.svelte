<script lang="ts">
  import { onDestroy } from 'svelte';
  import { getFile } from '../../core/api';

  export let src: string;
  export let ratio: number = 5/4;

  let thumbnail: string;
  if (src) {
    getFile(src).subscribe((url) => (thumbnail = url));
  }
  onDestroy(() => {
    if (thumbnail) URL.revokeObjectURL(thumbnail);
  });
</script>

<div class="thumbnail" style:padding-top="{`${Math.round(1/ratio*100)}%`}">
  <img src={thumbnail} alt="Thumbnail" />
</div>

<style>
  .thumbnail {
    position: relative;
    width: 100%;
    height: 0;
    background-color: #efefef;
  }
  img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
  }
</style>
