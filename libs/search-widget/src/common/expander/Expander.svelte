<script lang="ts">
  import { run } from 'svelte/legacy';

  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { IconButton } from '../button';

  interface Props {
    expanded?: boolean;
    duration?: number;
    header?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let { expanded = $bindable(false), duration = 300, header, children }: Props = $props();

  const dispatch = createEventDispatcher();
  let content: HTMLElement = $state();
  let showContent: boolean = $state(false);
  let contentHeight = $state(0);
  let timer;

  onMount(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      window.requestAnimationFrame(() => {
        if (!Array.isArray(entries) || !entries.length) {
          return;
        }
        if (expanded && entries[0].contentRect.height !== contentHeight) {
          contentHeight = entries[0].contentRect.height;
        }
      });
    });
    resizeObserver.observe(content);

    return () => {
      resizeObserver.disconnect();
    };
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
  run(() => {
    if (expanded) {
      expand();
    } else {
      collapse();
    }
  });
</script>

<div class="sw-expander">
  {#if header}
    <div
      onclick={() => (expanded = !expanded)}
      onkeypress={(e) => {
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
      {@render header?.()}
    </div>
  {/if}
  <div
    class="expander-content"
    style:height="{contentHeight}px"
    style:visibility={showContent ? 'visible' : 'hidden'}
    style:transition={`height ${duration}ms`}>
    <div bind:this={content}>
      {@render children?.()}
    </div>
  </div>
</div>

<style src="./Expander.css"></style>
