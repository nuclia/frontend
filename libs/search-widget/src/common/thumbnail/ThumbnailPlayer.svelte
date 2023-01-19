<script>
  import Thumbnail from './Thumbnail.svelte';
  import { createEventDispatcher } from 'svelte';
  import Icon from '../icons/Icon.svelte';
  import Spinner from '../spinner/Spinner.svelte';

  export let thumbnail = '';
  export let fallback = '';
  export let aspectRatio;
  export let spinner = false;
  export let hasBackground = false;

  let loaded = false;

  const dispatch = createEventDispatcher();

  const play = () => {
    dispatch('play');
  };

  const onLoad = () => {
    loaded = true;
    dispatch('loaded');
  };
</script>

{#if thumbnail || fallback}
  <div
    class="sw-thumbnail-player"
    tabindex="-1"
    on:click={play}>
    <Thumbnail
      src={thumbnail}
      {fallback}
      noBackground={!hasBackground}
      {aspectRatio}
      on:loaded={onLoad} />

    {#if loaded}
      <div
        class="action-container"
        class:play-icon={!spinner}
        tabindex="0"
        on:keyup={(e) => {
          if (e.key === 'Enter') play();
        }}>
        {#if !spinner}
          <Icon
            name="play"
            size="large" />
        {:else}
          <Spinner />
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style
  lang="scss"
  src="./ThumbnailPlayer.scss"></style>
