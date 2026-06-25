<script lang="ts">
  import { createEventDispatcher, onMount, tick } from 'svelte';
  import { IconButton } from '../button';

  interface Props {
    expanded?: boolean;
    duration?: number;
    ariaLabel?: string;
    header?: import('svelte').Snippet;
    children?: import('svelte').Snippet;
  }

  let { expanded = $bindable(false), duration = 300, ariaLabel = '', header, children }: Props = $props();

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
  $effect(() => {
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
      onkeydown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          expanded = !expanded;
        }
      }}
      role="button"
      tabindex="0"
      aria-expanded={expanded}
      aria-label={ariaLabel}
      class="header"
      class:expanded>
      <span class="expander-icon">
        <IconButton
          icon="chevron-right"
          size="small"
          aspect="basic"
          ariaLabel=""
          tabIndex={-1}
          ariaHidden={true} />
      </span>
      {@render header?.()}
    </div>
  {/if}
  <div
    class="expander-content"
    inert={!showContent ? true : undefined}
    style:height="{contentHeight}px"
    style:visibility={showContent ? 'visible' : 'hidden'}
    style:transition={`height ${duration}ms`}>
    <div bind:this={content}>
      {@render children?.()}
    </div>
  </div>
</div>

<style src="./Expander.css"></style>
