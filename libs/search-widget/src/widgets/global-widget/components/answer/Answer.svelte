<script lang="ts">
  import type { Ask } from '@nuclia/core';
  import { isMobileViewport } from '../../../../common/utils';
  import { MarkdownRendering } from '../../../../components/viewer/renderers/renderings';
  import Feedback from './Feedback.svelte';

  interface Props {
    answer: Partial<Ask.Answer>;
    rank?: number;
    hideFeedback?: boolean;
  }

  let { answer, rank = 0, hideFeedback = false }: Props = $props();
  let text = $derived(answer.text || '');
  let innerWidth = $state(window.innerWidth);
  let isMobile = $derived(isMobileViewport(innerWidth));
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

<style src="./Answer.css"></style>
