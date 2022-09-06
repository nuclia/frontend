<script>
  import TimePlayer from './TimePlayer.svelte';
  import {createEventDispatcher} from "svelte";

  export let paragraph;
  export let stack = false;
  export let ellipsis = false;
  export let selected = false;
  export let minimized = false;

  let hovering = false;

  const dispatch = createEventDispatcher();
  const play = () => {
    dispatch('play', { paragraph });
  }
</script>

<li class="paragraph"
    class:stack
    on:mouseenter={() => hovering = true}
    on:mouseleave={() => hovering = false}
    on:click={play}
>
  <div style="display: flex">
    <TimePlayer start="{paragraph.start || 0}"
                end="{paragraph.end}"
                {selected}
                hover={hovering}
                {minimized}
                on:play={play}/>
  </div>
  <div class="paragraph-text" class:ellipsis>
    {@html paragraph.text}
  </div>
</li>

<style>
  .paragraph {
    cursor: pointer;
    display: flex;
    gap: var(--rhythm-1);
  }
  .paragraph:not(.stack) {
    align-items: center;
  }
  .paragraph.stack {
    flex-direction: column;
    gap: var(--rhythm-0_5);
  }
  .paragraph .paragraph-text {
    overflow-wrap: break-word;
  }
  .paragraph:hover {
    background-color: var(--color-neutral-lightest);
    border-top-left-radius: var(--rhythm-1_5);
  }

  .paragraph:not(.stack):hover {
    border-bottom-left-radius: var(--rhythm-1_5);
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
