<script>
  import Thumbnail from '../widgets/row/Thumbnail.svelte';
  import { createEventDispatcher } from 'svelte';
  import Icon from './Icon.svelte';
  import { fade } from 'svelte/transition';
  import Spinner from '../components/spinner/Spinner.svelte';

  export let thumbnail = '';
  export let aspectRatio;
  export let spinner = false;
  let loaded = false;

  const dispatch = createEventDispatcher();

  const play = () => {
    dispatch('play');
  };
</script>

{#if thumbnail}
  <div class="sw-thumbnail-player" tabindex="-1" on:click={play}>
    <Thumbnail src={thumbnail}
               noBackground
               {aspectRatio}
               on:loaded={() => (loaded = true)} />

    {#if loaded}
      <div class="action-container"
           class:play-icon={!spinner}
           tabindex="0"
           in:fade={{ delay: 240 }}
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
