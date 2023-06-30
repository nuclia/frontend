<script lang="ts">
  import TimeIndicator from '../indicators/TimeIndicator.svelte';
  import { createEventDispatcher } from 'svelte';
  import PageIndicator from '../indicators/PageIndicator.svelte';
  import { ResultType } from '../../core';
  import IconButton from '../button/IconButton.svelte';
  import { Search } from '@nuclia/core';

  export let paragraph: Search.FindParagraph;
  export let resultType: ResultType;
  export let stack = false;
  export let ellipsis = false;
  export let selected = false;
  export let minimized = false;
  export let hideIndicator = false;
  export let disabled = false;

  let hovering = false;
  let expanded = false;

  const dispatch = createEventDispatcher();
  const open = () => {
    dispatch('open', true);
  };
  const mediaKinds: ResultType[] = ['audio', 'video'];
  $: isMedia = mediaKinds.includes(resultType);
  $: isPdf = resultType === 'pdf';

  let paragraphElement: HTMLElement;
  $: hasEllipsis = paragraphElement && paragraphElement.offsetWidth < paragraphElement.scrollWidth;
  $: paragraphElement && dispatch('paragraphHeight', paragraphElement.offsetHeight);

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
      {#if hasEllipsis && !stack}
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
    class:no-indicator={hideIndicator}
    class:stack
    class:selected
    class:disabled
    class:hover={expanded}
    on:mouseenter={() => (hovering = true)}
    on:mouseleave={() => (hovering = false)}
    on:click={disabled ? null : open}>
    <div
      class="indicator-container"
      class:hidden={hideIndicator}>
      {#if isPdf}
        <PageIndicator
          page={paragraph.position.page_number >= 0 ? paragraph.position.page_number + 1 : undefined}
          {stack}
          {selected}
          hovering={hovering || expanded} />
      {:else if isMedia}
        <TimeIndicator
          start={paragraph.position.start_seconds || 0}
          {selected}
          hover={hovering || expanded}
          {minimized} />
      {/if}
    </div>
    <div
      class="paragraph-text"
      class:ellipsis={ellipsis && !expanded}
      bind:this={paragraphElement}>
      {@html paragraph.text}
    </div>
  </div>
</li>

<style
  lang="scss"
  src="./ParagraphResult.scss"></style>
