<script>
  import TimePlayer from './TimePlayer.svelte';
  import { createEventDispatcher } from 'svelte';

  export let paragraph;
  export let stack = false;
  export let ellipsis = false;
  export let selected = false;
  export let minimized = false;

  let hovering = false;

  const dispatch = createEventDispatcher();
  const play = () => {
    dispatch('play', { paragraph });
  };
</script>

<li
  class="sw-paragraph-player"
  class:stack
  on:mouseenter={() => (hovering = true)}
  on:mouseleave={() => (hovering = false)}
  on:click={play}
>
  <div style="display: flex">
    <TimePlayer
      start={paragraph.start || 0}
      end={paragraph.end}
      {selected}
      hover={hovering}
      {minimized}
      on:play={play}
    />
  </div>
  <div class="paragraph-text" class:ellipsis>
    {@html paragraph.text}
  </div>
</li>

<style lang="scss" src="./ParagraphPlayer.scss"></style>
