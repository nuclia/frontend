<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { ResultType } from '../../core';
  import { Search } from '@nuclia/core';

  export let paragraph: Search.FindParagraph;
  export let resultType: ResultType;
  export let stack = false;
  export let ellipsis = false;
  export let selected = false;
  export let noIndicator = false;
  export let disabled = false;

  let hovering = false;
  let expanded = true;

  const dispatch = createEventDispatcher();
  const open = () => {
    dispatch('open', true);
  };
  const mediaKinds: ResultType[] = ['audio', 'video'];
  $: isMedia = mediaKinds.includes(resultType);
  $: isPdf = resultType === 'pdf';

  let paragraphElement: HTMLElement;
  $: hasEllipsis = paragraphElement && paragraphElement.offsetWidth < paragraphElement.scrollWidth;

</script>

<li class="sw-paragraph-result">
  <div
    class="paragraph-result-container"
    class:no-indicator={noIndicator}
    class:stack
    class:selected
    class:disabled
    on:mouseenter={() => (hovering = true)}
    on:mouseleave={() => (hovering = false)}
    on:click={disabled ? null : open}
    on:keyup={(e) => {
      if(e.key === 'Enter' && !disabled) open()
    }}
  >
    <div
      class="paragraph-text"
      class:ellipsis={ellipsis}
      bind:this={paragraphElement}>
      {@html paragraph.text.trim()}
    </div>
  </div>
</li>

<style
  lang="scss"
  src="./ParagraphResult.scss"></style>
