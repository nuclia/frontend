<script lang="ts">
  import Feedback from './Feedback.svelte';
  import type { Ask } from '@nuclia/core';
  import { isMobileViewport } from '../../../../common/utils';
  import { MarkdownRendering } from '../../../../components/viewer/renderers/renderings';

  export let answer: Partial<Ask.Answer>;
  export let rank = 0;
  export let hideFeedback = false;
  let text = '';
  let innerWidth = window.innerWidth;
  
  $: text = answer.text || '';
  $: isMobile = isMobileViewport(innerWidth);

</script>

<svelte:window bind:innerWidth />
<div class="sw-answer">
  <div class="answer-container">
    <div class="text"><MarkdownRendering {text} /></div>
    {#if !isMobile && !hideFeedback}
      <Feedback {rank} />
    {/if}
  </div>
</div>

<style
  lang="scss"
  src="./Answer.scss"></style>
