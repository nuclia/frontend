<script lang="ts">
  import type { Search } from '@nuclia/core';
  import type { TypedResult } from '../../../../core';
  import { goToUrl, trackingEngagement } from '../../../../core';
  import ParagraphResult from '../paragraph-result/ParagraphResult.svelte';

  interface Props {
    result: TypedResult;
  }

  let { result }: Props = $props();

  let innerWidth = $state(window.innerWidth);
  let paragraphs = $derived(result.paragraphs || []);

  function clickOnResult(paragraph?: Search.FindParagraph) {
    trackingEngagement.set({ type: 'RESULT', rid: result.id, paragraph });
    if (result.origin?.url) {
      goToUrl(result.origin.url);
    }
  }
</script>

<svelte:window bind:innerWidth />

<div class="sw-result-row">
  <div class="result-container">
    <h3
      class="ellipsis title-xs"
      onclick={() => clickOnResult()}
      onkeyup={(e) => {
        if (e.key === 'Enter') clickOnResult();
      }}>
      {result?.title}
    </h3>

    <div tabindex="-1">
      {#if !!paragraphs[0]}
        <ParagraphResult
          paragraph={paragraphs[0]}
          resultType={result.resultType}
          noIndicator={true}
          on:open={() => clickOnResult(paragraphs[0])} />
      {/if}
      {#if result.origin?.url}
        <a
          href={result.origin.url}
          class="body-m link-origin">
          {result.origin.url}
        </a>
      {/if}
    </div>
  </div>
</div>

<style src="./ResultRow.css"></style>
