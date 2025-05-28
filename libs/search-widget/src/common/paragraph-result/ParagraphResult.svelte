<script lang="ts">
  import TimeIndicator from '../indicators/TimeIndicator.svelte';
  import { createEventDispatcher } from 'svelte';
  import PageIndicator from '../indicators/PageIndicator.svelte';
  import type { RankedParagraph, ResultType } from '../../core';
  import IconButton from '../button/IconButton.svelte';
  import { Search } from '@nuclia/core';
  import MarkdownRendering from '../../components/viewer/renderers/renderings/MarkdownRendering.svelte';

  interface Props {
    paragraph: RankedParagraph;
    resultType: ResultType;
    stack?: boolean;
    ellipsis?: boolean;
    selected?: boolean;
    minimized?: boolean;
    noIndicator?: boolean;
    disabled?: boolean;
    expanded?: boolean;
  }

  let {
    paragraph,
    resultType,
    stack = false,
    ellipsis = false,
    selected = false,
    minimized = false,
    noIndicator = false,
    disabled = false,
    expanded = $bindable(false),
  }: Props = $props();

  let hovering = $state(false);
  let hasEllipsis = $state(false);

  const dispatch = createEventDispatcher();
  const open = () => {
    dispatch('open', true);
  };
  const mediaKinds: ResultType[] = ['audio', 'video'];
  let isMedia = $derived(mediaKinds.includes(resultType));
  let isPdf = $derived(resultType === 'pdf');

  let paragraphElement: HTMLElement = $state();
  function checkHeight() {
    hasEllipsis = ellipsis && paragraphElement && paragraphElement.offsetHeight > 24;
  }

  function toggleExpand() {
    expanded = !expanded;
    setTimeout(() => dispatch('paragraphHeight', paragraphElement.offsetHeight));
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
    onmouseenter={() => (hovering = true)}
    onmouseleave={() => (hovering = false)}
    onclick={disabled ? null : open}
    onkeyup={(e) => {
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
