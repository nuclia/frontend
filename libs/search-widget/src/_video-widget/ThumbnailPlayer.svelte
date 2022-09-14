<script>
  import Thumbnail from '../widgets/row/Thumbnail.svelte';
  import { createEventDispatcher } from 'svelte';
  import Icon from './Icon.svelte';
  import { fade } from 'svelte/transition';
  import Spinner from '../components/spinner/Spinner.svelte';
  import { Duration } from './transition.utils';

  export let thumbnail = '';
  export let aspectRatio;
  export let spinner = false;
  let loaded = false;

  const dispatch = createEventDispatcher();

  const play = () => {
    dispatch('play');
  };

  const onLoad = () => {
    loaded = true;
    dispatch('loaded');
  }
</script>

{#if thumbnail}
  <div class="sw-thumbnail-player"
       tabindex="-1"
       in:fade={{ delay: Duration.SUPERFAST }}
       on:click={play}>
    <Thumbnail src={thumbnail}
               noBackground
               {aspectRatio}
               on:loaded={onLoad} />

    {#if loaded}
      <div class="action-container"
           class:play-icon={!spinner}
           tabindex="0"
           in:fade={{ delay: Duration.SUPERFAST }}
           on:keyup={(e) => {
             if (e.key === 'Enter') play();
           }}>
        {#if !spinner}
          <Icon name="play" size="large" />
        {:else}
          <Spinner />
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style lang="scss" src="./ThumbnailPlayer.scss"></style>
