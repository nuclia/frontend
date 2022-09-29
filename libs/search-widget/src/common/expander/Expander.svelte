<script lang="ts">
  import { onMount, tick } from 'svelte';

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
  <slot name="header" />
  <div
    class="expander-content"
    style:height={contentHeight}
    style:display={showContent ? 'block' : 'none'}
    style:transition={`height ${duration}ms`}
  >
    <div bind:this={content}>
      <slot />
    </div>
  </div>
</div>

<style lang="scss" src="./Expander.scss"></style>
