<script>
  import Thumbnail from '../widgets/row/Thumbnail.svelte';
  import { createEventDispatcher } from 'svelte';
  import Icon from './Icon.svelte';
  import { fade } from 'svelte/transition';

  export let thumbnail = '';
  export let aspectRatio;
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
      <div class="play-icon"
           tabindex="0"
           in:fade={{ delay: 240 }}
           on:keyup={(e) => {
             if (e.key === 'Enter') play();
           }}>
        <Icon name="play" size="large" />
      </div>
    {/if}
  </div>
{/if}

<style lang="scss" src="./ThumbnailPlayer.scss"></style>
