<script>
  import TimePlayer from './TimePlayer.svelte';
  import {createEventDispatcher} from "svelte";

  export let paragraph;
  export let stack = false;
  export let ellipsis = false;
  export let selected = false;

  const dispatch = createEventDispatcher();
  const play = () => {
    dispatch('play', { paragraph });
  }
</script>

<li class="paragraph" class:stack>
  <div>
    <TimePlayer time="{paragraph.time}"
                {selected}
                on:play={play}/>
  </div>
  <div class:ellipsis>
    {@html paragraph.text}
  </div>
</li>

<style>
  .paragraph {
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

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
