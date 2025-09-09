<script lang="ts">
  import { Search } from '@nuclia/core';
  import { createEventDispatcher } from 'svelte';
  import type { ResultType } from '../../core';

  interface Props {
    paragraph: Search.FindParagraph;
    resultType: ResultType;
    stack?: boolean;
    ellipsis?: boolean;
    selected?: boolean;
    noIndicator?: boolean;
    disabled?: boolean;
  }

  let {
    paragraph,
    resultType,
    stack = false,
    ellipsis = false,
    selected = false,
    noIndicator = false,
    disabled = false,
  }: Props = $props();

  let hovering = $state(false);
  let expanded = true;

  const dispatch = createEventDispatcher();
  const open = () => {
    dispatch('open', true);
  };
  const mediaKinds: ResultType[] = ['audio', 'video'];
  let isMedia = $derived(mediaKinds.includes(resultType));
  let isPdf = $derived(resultType === 'pdf');

  let paragraphElement: HTMLElement = $state();
  let hasEllipsis = $derived(paragraphElement && paragraphElement.offsetWidth < paragraphElement.scrollWidth);
</script>

<li class="sw-paragraph-result">
  <div
    class="paragraph-result-container"
    class:no-indicator={noIndicator}
    class:stack
    class:selected
    class:disabled
    onmouseenter={() => (hovering = true)}
    onmouseleave={() => (hovering = false)}
    onclick={disabled ? null : open}
    onkeyup={(e) => {
      if (e.key === 'Enter' && !disabled) open();
    }}>
    <div
      class="paragraph-text"
      class:ellipsis
      bind:this={paragraphElement}>
      {@html paragraph.text.trim()}
    </div>
  </div>
</li>

<style src="./ParagraphResult.css"></style>
