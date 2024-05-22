<script lang="ts">
  import TimeIndicator from '../indicators/TimeIndicator.svelte';
  import { createEventDispatcher } from 'svelte';
  import PageIndicator from '../indicators/PageIndicator.svelte';
  import type { RankedParagraph, ResultType } from '../../core';
  import IconButton from '../button/IconButton.svelte';
  import { Search } from '@nuclia/core';
  import MarkdownRendering from '../../components/viewer/renderers/renderings/MarkdownRendering.svelte';

  export let paragraph: RankedParagraph;
  export let resultType: ResultType;
  export let stack = false;
  export let ellipsis = false;
  export let selected = false;
  export let minimized = false;
  export let noIndicator = false;
  export let disabled = false;

  let hovering = false;
  let expanded = false;
  let hasEllipsis = false;

  const dispatch = createEventDispatcher();
  const open = () => {
    dispatch('open', true);
  };
  const mediaKinds: ResultType[] = ['audio', 'video'];
  $: isMedia = mediaKinds.includes(resultType);
  $: isPdf = resultType === 'pdf';

  let paragraphElement: HTMLElement;
  function checkHeight() {
    hasEllipsis = ellipsis && paragraphElement && paragraphElement.offsetHeight > 24;
  }

  function toggleExpand() {
    expanded = !expanded;
    setTimeout(() => dispatch('paragraphHeight', `${paragraphElement.offsetHeight}px`));
  }
</script>

<li class="sw-paragraph-result">
  {#if !stack}
    <div
      class="expander-button-container"
      class:expanded>
      {#if hasEllipsis}
        <IconButton
          icon="chevron-right"
          aspect="basic"
          size="xsmall"
          on:click={toggleExpand} />
      {/if}
    </div>
  {/if}
  <div
    class="paragraph-result-container"
    class:no-indicator={noIndicator}
    class:stack
    class:selected
    class:disabled
    class:hover={expanded}
    on:mouseenter={() => (hovering = true)}
    on:mouseleave={() => (hovering = false)}
    on:click={disabled ? null : open}
    on:keyup={(e) => {
      if (e.key === 'Enter' && !disabled) open();
    }}>
    <div
      class="indicator-container"
      class:hidden={noIndicator}>
      {#if isPdf}
        <PageIndicator
          page={paragraph.position.page_number}
          {stack}
          {selected}
          hovering={hovering || expanded} />
      {:else if isMedia}
        <TimeIndicator
          start={paragraph.position.start_seconds?.[0]}
          {selected}
          hover={hovering || expanded}
          {minimized} />
      {/if}
    </div>
    <div
      class="paragraph-text"
      class:ellipsis={hasEllipsis && !expanded}
      bind:this={paragraphElement}>
      <MarkdownRendering
        text={paragraph.text}
        on:setElement={checkHeight} />
    </div>
  </div>
</li>

<style
  lang="scss"
  src="./ParagraphResult.scss"></style>
