<script>
  import { createEventDispatcher } from 'svelte';
  import { _ } from '../../core/i18n';
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
      {#if !spinner}
        <button
          class="action-container play-icon"
          type="button"
          aria-label={$_('player.play')}
          onclick={play}
          >
          <Icon
            name="play"
            size="large" />
        </button>
      {:else}
        <div class="action-container">
          <Spinner />
        </div>
      {/if}
    {/if}
  </div>
{/if}

<style src="./ThumbnailPlayer.css"></style>
