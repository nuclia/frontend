<script>
  import { createEventDispatcher } from 'svelte';
  import Icon from '../icons/Icon.svelte';
  import Spinner from '../spinner/Spinner.svelte';
  import Thumbnail from './Thumbnail.svelte';

  /**
   * @typedef {Object} Props
   * @property {string} [thumbnail]
   * @property {string} [fallback]
   * @property {any} aspectRatio
   * @property {boolean} [spinner]
   * @property {boolean} [hasBackground]
   */

  /** @type {Props} */
  let { thumbnail = '', fallback = '', aspectRatio, spinner = false, hasBackground = false } = $props();

  let loaded = $state(false);

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
    onclick={play}>
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
        onkeyup={(e) => {
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

<style src="./ThumbnailPlayer.css"></style>
