<script lang="ts">
  import TimeIndicator from '../indicators/TimeIndicator.svelte';
  import { createEventDispatcher } from 'svelte';
  import PageIndicator from '../indicators/PageIndicator.svelte';
  import type { MediaWidgetParagraph, PdfWidgetParagraph } from '../../core/models';
  import { PreviewKind } from '../../core/models';

  export let paragraph: MediaWidgetParagraph | PdfWidgetParagraph;
  export let stack = false;
  export let ellipsis = false;
  export let selected = false;
  export let minimized = false;
  export let hideIndicator = false;

  let hovering = false;

  const dispatch = createEventDispatcher();
  const open = () => {
    dispatch('open', { paragraph });
  };
  const mediaKinds: PreviewKind[] = [PreviewKind.AUDIO, PreviewKind.VIDEO, PreviewKind.YOUTUBE];
  $: isMedia = mediaKinds.includes(paragraph.preview);
  $: isPdf = paragraph.preview === PreviewKind.PDF;
  $: isSemantic = paragraph.paragraph.sentences && paragraph.paragraph.sentences.length > 0;
</script>

<li
  class="sw-paragraph-result"
  class:no-indicator={hideIndicator}
  class:stack
  class:selected
  on:mouseenter={() => (hovering = true)}
  on:mouseleave={() => (hovering = false)}
  on:click={open}>
  <div
    class="indicator-container"
    class:hidden={hideIndicator}>
    {#if isPdf}
      <PageIndicator
        page={paragraph.page}
        {hovering} />
    {:else if isMedia}
      <TimeIndicator
        start={paragraph.start_seconds || 0}
        {selected}
        hover={hovering}
        {minimized}
        on:play={open} />
    {/if}
  </div>
  <div
    class="paragraph-text"
    class:semantic={isSemantic}
    class:ellipsis>
    {@html paragraph.text}
  </div>
</li>

<style
  lang="scss"
  src="./ParagraphResult.scss"></style>
