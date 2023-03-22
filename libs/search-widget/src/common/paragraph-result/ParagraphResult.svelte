<script lang="ts">
  import TimeIndicator from '../indicators/TimeIndicator.svelte';
  import { createEventDispatcher } from 'svelte';
  import PageIndicator from '../indicators/PageIndicator.svelte';
  import type { WidgetParagraph } from '../../core/models';
  import { PreviewKind } from '../../core/models';

  export let paragraph: WidgetParagraph;
  export let stack = false;
  export let ellipsis = false;
  export let selected = false;
  export let minimized = false;
  export let hideIndicator = false;
  export let disabled = false;

  let hovering = false;

  const dispatch = createEventDispatcher<boolean>();
  const open = () => {
    dispatch('open', true);
  };
  const mediaKinds: PreviewKind[] = [PreviewKind.AUDIO, PreviewKind.VIDEO, PreviewKind.YOUTUBE];
  $: isMedia = mediaKinds.includes(paragraph.preview);
  $: isPdf = paragraph.preview === PreviewKind.PDF;
</script>

<li
  class="sw-paragraph-result"
  class:no-indicator={hideIndicator}
  class:stack
  class:selected
  class:disabled
  on:mouseenter={() => (hovering = true)}
  on:mouseleave={() => (hovering = false)}
  on:click={disabled ? null : open}>
  <div
    class="indicator-container"
    class:hidden={hideIndicator}>
    {#if isPdf}
      <PageIndicator
        page={paragraph.page >= 0 ? paragraph.page + 1 : undefined}
        {stack}
        {selected}
        {hovering} />
    {:else if isMedia}
      <TimeIndicator
        start={paragraph.start_seconds || 0}
        {selected}
        hover={hovering}
        {minimized} />
    {/if}
  </div>
  <div
    class="paragraph-text"
    class:ellipsis>
    {@html paragraph.text}
  </div>
</li>

<style
  lang="scss"
  src="./ParagraphResult.scss"></style>
