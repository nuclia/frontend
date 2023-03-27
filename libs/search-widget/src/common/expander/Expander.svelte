<script lang="ts">
  import { onMount, tick } from 'svelte';
  import Icon from '../icons/Icon.svelte';

  export let expanded: boolean = false;
  export let duration: number = 300;

  let content;
  let showContent: boolean = false;
  let contentHeight: string = '0px';
  let timer;

  $: if (expanded) {
    expand();
  } else {
    collapse();
  }

  onMount(() => {});

  const expand = async () => {
    showContent = true;
    await tick();
    contentHeight = parseInt(content.getBoundingClientRect().height) + 'px';
  };

  const collapse = () => {
    contentHeight = '0px';
    timer && timer.clearTimeout();
    setTimeout(() => {
      showContent = false;
    }, duration);
  };
</script>

<div class="sw-expander">
  <div
    on:click={() => (expanded = !expanded)}
    on:keypress={(e) => {
      if (e.key === 'Enter') {
        expanded = !expanded;
      }
    }}
    class="header"
    class:expanded>
    <span class="expander-icon"><Icon name="chevron-right" /></span>
    <slot name="header" />
  </div>
  <div
    class="expander-content"
    style:height={contentHeight}
    style:display={showContent ? 'block' : 'none'}
    style:transition={`height ${duration}ms`}>
    <div bind:this={content}>
      <slot />
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./Expander.scss"></style>
