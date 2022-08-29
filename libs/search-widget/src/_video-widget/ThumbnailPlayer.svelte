<script>
  import Thumbnail from '../widgets/row/Thumbnail.svelte';
  import {createEventDispatcher} from 'svelte';

  export let thumbnail = '';
  const dispatch = createEventDispatcher();

  const play = () => {
    dispatch('play');
  }

</script>

{#if thumbnail}
  <div class="thumbnail-player"
       tabindex="-1"
       on:click={play}>
    <Thumbnail src={thumbnail} noBackground/>
    <div class="play-icon"
         tabindex="0"
         on:keyup={(e) => { if (e.key === 'Enter') play(); }}>
      <svg tabindex="-1" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" d="M6 19.14V4.86L18.693 12 6 19.14Z" clip-rule="evenodd"/>
      </svg>
    </div>
  </div>
{/if}
<style>
  .thumbnail-player {
    cursor: pointer;
    flex: 0 0 auto;
    position: relative;
    width: var(--width-thumbnail);
  }

  .thumbnail-player .play-icon {
    --icon-size: var(--rhythm-5);

    background: rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    color: var(--color-dark-stronger);
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

  .thumbnail-player .play-icon svg {
    fill: currentColor;
    height: var(--icon-size);
    width: var(--icon-size);
  }

  .thumbnail-player .play-icon svg:focus {
    outline: 0;
  }
</style>
