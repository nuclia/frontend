<script>
  import Thumbnail from '../widgets/row/Thumbnail.svelte';
  import {createEventDispatcher} from 'svelte';
  import Icon from './Icon.svelte';
  import { fade } from 'svelte/transition';

  export let thumbnail = '';
  let loaded = false;

  const dispatch = createEventDispatcher();

  const play = () => {
    dispatch('play');
  }

</script>

{#if thumbnail}
  <div class="thumbnail-player"
       tabindex="-1"
       on:click={play}>
    <Thumbnail src={thumbnail}
               noBackground
               on:loaded={loaded = true}/>

    {#if loaded}
      <div class="play-icon"
           tabindex="0"
           in:fade={{delay: 240}}
           on:keyup={(e) => { if (e.key === 'Enter') play(); }}>
        <Icon name="play" size="large" />
      </div>
    {/if}
  </div>
{/if}
<style>
  .thumbnail-player {
    cursor: pointer;
    flex: 0 0 auto;
    position: relative;
  }

  .thumbnail-player .play-icon {
    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    color: var(--color-dark-stronger);
    display: flex;
    padding: var(--rhythm-1);
    left: 50%;
    position: absolute;
    top: 50%;
    transform: translate(-50%, -50%);
  }

  .thumbnail-player .play-icon:focus {
    box-shadow: var(--focus-shadow);
    outline: 0;
  }

  .thumbnail-player:hover .play-icon {
    background: rgba(255, 255, 255, 0.95);
  }

  .thumbnail-player:active .play-icon {
    background: var(--color-light-stronger);
  }

  @media (min-width: 600px) {
    .thumbnail-player {
      width: var(--width-thumbnail);
    }
  }
</style>
