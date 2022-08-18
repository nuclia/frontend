<script lang="ts">
  import type { IResource } from '@nuclia/core';
  import { formatDate } from '../../core/utils';
  import { setDisplayedResource } from '../../core/store';
  import Thumbnail from './thumbnail.svelte';

  export let result: IResource;
  let labels: string[];
  $: labels = (result.usermetadata?.classifications || []).map((label) => label.label);
</script>

<div
  class="square"
  on:click|preventDefault={() => setDisplayedResource({ uid: result.id })}
  on:keyup={(e) => {
    if (e.key === 'Enter') setDisplayedResource({ uid: result.id });
  }}
  on:focus
  tabindex="0"
>
  <div class="thumbnail">
    {#if result.thumbnail}
      <Thumbnail src={result.thumbnail} ratio={16/9} />
    {/if}
  </div>
  <div class="body">
    <div class="labels">
      {#each labels.slice(0,2) as label}
        <div class="label">{ label }</div>
      {/each}
      {#if labels.length > 2}
        <div class="label">+</div>
      {/if}
    </div>
    <h2 class="title">{decodeURIComponent(result.title || '–')}</h2>
    <div class="byline">
      {#if result.created}
        {formatDate(result.created)}
      {/if}
    </div>
  </div>
</div>

<style>
  .square {
    width: 280px;
    height: 328px;
    cursor: pointer;
    background-color: var(--color-light-stronger);
  }
  .thumbnail {
    width: 100%;
    min-height: 160px;
  }
  .body {
    padding: 1.5em 1em;
  }
  .title {
    margin: 0 0 0.25em 0;
    height: 4em;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-bold);
    line-height: 1.25;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .byline {
    font-size: 0.75em;
  }
  .labels {
    margin-bottom: 0.5em;
    white-space: nowrap;
    overflow: hidden;
  }
  .label {
    display: inline-block;
    margin-right: 4px;
    padding: 0.25em 1em;
    max-width: 100%;
    font-size: 0.75em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    color: #454ade;
    background-color: #e6e6f9;
    border-radius: 2px;
  }
</style>
