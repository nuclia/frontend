<script>
  import TimeIndicator from '../indicators/TimeIndicator.svelte';
  import {createEventDispatcher} from 'svelte';
  import PageIndicator from "../indicators/PageIndicator.svelte";

  export let paragraph;
  export let stack = false;
  export let ellipsis = false;
  export let selected = false;
  export let minimized = false;
  export let hideIndicator = false;

  let hovering = false;

  const dispatch = createEventDispatcher();
  const open = () => {
    dispatch('open', {paragraph});
  };
</script>

<li class="sw-paragraph-result"
    class:no-indicator={hideIndicator}
    class:stack
    on:mouseenter={() => (hovering = true)}
    on:mouseleave={() => (hovering = false)}
    on:click={open}>
  <div class="indicator-container" class:hidden={hideIndicator}>
    {#if paragraph.start_seconds !== undefined}
      <TimeIndicator start={paragraph.start_seconds || 0}
                     {selected}
                     hover={hovering}
                     {minimized}
                     on:play={open}
      />
    {:else}
      <PageIndicator page={paragraph.page} {hovering}></PageIndicator>
    {/if}
  </div>
  <div class="paragraph-text" class:ellipsis>
    {@html paragraph.text}
  </div>
</li>

<style lang="scss" src="./ParagraphResult.scss"></style>
