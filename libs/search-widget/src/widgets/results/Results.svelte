<script lang="ts">
  import { nucliaState } from '../../core/store';
  import Row from '../row/Row.svelte';
  import Square from '../row/Square.svelte';
  import type { IResource } from '@nuclia/core';
  import { _ } from '../../core/i18n';
  import LoadingDots from '../../components/spinner/LoadingDots.svelte';
  import { map, switchMap, take, forkJoin } from 'rxjs';

  export let displayThumbnail = true;
  export let formWidget = false;
  export let results: IResource[] = [];

  const enhancedResults = nucliaState().results.pipe(
    switchMap((results) =>
      forkJoin(
        results.map((result) =>
          forkJoin([
            nucliaState().getMatchingParagraphs(result.id).pipe(take(1)),
            nucliaState().getMatchingSentences(result.id).pipe(take(1)),
          ]).pipe(
            map(([paragraphs, sentences]) => ({
              resource: result,
              hasParagraphs: paragraphs.length > 0,
              hasSentences: sentences.length > 0,
            })),
          ),
        ),
      ),
    ),
  );

  const paragraphResults = enhancedResults.pipe(
    map((results) => results.filter((result) => result.hasParagraphs).map((result) => result.resource)),
  );
  const semanticResults = enhancedResults.pipe(
    map((results) => results.filter((result) => result.hasSentences).map((result) => result.resource)),
  );
  const otherResults = enhancedResults.pipe(
    map((results) => results.filter((result) => !result.hasParagraphs && !result.hasSentences).map((result) => result.resource)),
  );

  const hasSearchError = nucliaState().hasSearchError;
  const pendingResults = nucliaState().pendingResults;
  let showAll = false;
</script>

{#if $hasSearchError}
  <div class="error"><strong>{$_('error.search')}</strong>
    <span>{$_('error.search-beta')}</span></div>
{:else if $pendingResults}
  <h3 class="empty" >
    <LoadingDots/>
  </h3>
{:else if results.length === 0}
  <h3 class="empty">{$_('results.empty')}</h3>
{:else}
  <div class="results">
    {#if $paragraphResults.length > 0}
      <div class="subtitle">{$_('results.paragraphs')}</div>
      <div>
        {#each $paragraphResults.slice(0, 3) as result}
          <div class="result">
            <Row {displayThumbnail} {result} {formWidget}/>
          </div>
        {/each}
      </div>
    {/if}
    {#if $semanticResults.length > 0}
      <div class="box semantic">
        <div class="subtitle">{$_('results.semantic')}</div>
        <div>
          {#each $semanticResults.slice(0, showAll ? undefined : 2) as result}
            <div class="result">
              <Row {displayThumbnail} {result} semantic={true}/>
            </div>
          {/each}
          {#if !showAll && $semanticResults.length > 2}
            <button on:click={() => showAll = true}>{$_('suggest.more')}</button>
          {/if}
        </div>
      </div>
    {/if}
    <div>
      {#each $paragraphResults.slice(3) as result}
        <div class="result">
          <Row {displayThumbnail} {result}/>
        </div>
      {/each}
    </div>
    {#if $otherResults.length > 0}
      <div class="box">
        <div class="squares">
          {#each $otherResults as result}
            <div class="square-result">
              <Square {result}/>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}

<style>
  .error,
  h3.empty {
    margin: 0;
    padding: 1em;
  }

  .results {
    padding: 2.5em;
  }

  @media (min-width: 1440px) {
    .results {
      padding: 2.5em 5em;
    }
  }

  .subtitle {
    margin-bottom: 1.5em;
    font-weight: var(--font-weight-bold);
    text-transform: uppercase;
  }

  .result {
    margin-bottom: 2em;
    padding-bottom: 1em;
    border-bottom: 1px solid var(--color-neutral-regular);
  }

  .result:last-child {
    margin-bottom: 0;
    border-bottom: 0;
  }

  .box {
    margin: 0 -1.25em;
    padding: 2.25em 1.25em;
    background-color: var(--color-neutral-lightest);
    border-radius: 4px;
  }

  @media (min-width: 1440px) {
    .results {
      padding: 2.25em 2.5em;
    }
  }

  .semantic {
    margin-bottom: 2em;
  }

  .squares {
    display: flex;
    flex-wrap: wrap;
  }

  .square-result {
    margin: 0 1.5em 1.5em 0;
  }

  button {
    position: relative;
    height: 2.5em;
    padding: 0.5em 1em;
    border: 0;
    background: var(--color-light-stronger);
    color: var(--color-neutral-strong);
    font: inherit;
    font-weight: var(--font-weight-semi-bold);
    cursor: pointer;
    -webkit-appearance: none;
    appearance: none;
    border-radius: 4px;
  }
</style>
