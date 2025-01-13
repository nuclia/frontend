<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { IconButton } from '../button';

  export let expanded: boolean = false;
  export let duration: number = 300;

  const dispatch = createEventDispatcher();
  let content: HTMLElement;
  let showContent: boolean = false;
  let contentHeight = 0;
  let timer;

  $: if (expanded) {
    expand();
  } else {
    collapse();
  }

  onMount(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      if (expanded && entries[0].contentRect.height !== contentHeight) {
        contentHeight = entries[0].contentRect.height;
      }
    });
    resizeObserver.observe(content);

    return () => {
      resizeObserver.disconnect();
    }
  });

  const expand = async () => {
    showContent = true;
    await tick();
    contentHeight = content.getBoundingClientRect().height;
    setTimeout(() => dispatch('toggleExpander', { expanded: true }), duration);
  };

  const collapse = () => {
    contentHeight = 0;
    timer && timer.clearTimeout();
    setTimeout(() => {
      showContent = false;
      dispatch('toggleExpander', { expanded: false });
    }, duration);
  };
</script>

<div class="sw-expander">
  {#if $$slots.header}
    <div
      on:click={() => (expanded = !expanded)}
      on:keypress={(e) => {
        if (e.key === 'Enter') {
          expanded = !expanded;
        }
      }}
      class="header"
      class:expanded>
      <span class="expander-icon">
        <IconButton
          icon="chevron-right"
          size="small"
          aspect="basic" />
      </span>
      <slot name="header" />
    </div>
  {/if}
  <div
    class="expander-content"
    style:height="{contentHeight}px"
    style:visibility={showContent ? 'visible' : 'hidden'}
    style:transition={`height ${duration}ms`}>
    <div bind:this={content}>
      <slot />
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./Expander.scss"></style>
