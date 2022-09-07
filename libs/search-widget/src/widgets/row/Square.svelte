<script lang="ts">
  import type { IResource } from '@nuclia/core';
  import { formatDate, formatTitle } from '../../core/utils';
  import { setDisplayedResource } from '../../core/store';
  import Thumbnail from './Thumbnail.svelte';

  export let result: IResource;
  let labels: string[];
  $: labels = (result.usermetadata?.classifications || []).map((label) => label.label);
</script>

<div
  class="sw-square"
  on:click|preventDefault={() => setDisplayedResource({ uid: result.id })}
  on:keyup={(e) => {
    if (e.key === 'Enter') setDisplayedResource({ uid: result.id });
  }}
  on:focus
  tabindex="0"
>
  <div class="thumbnail">
    {#if result.thumbnail}
      <Thumbnail src={result.thumbnail} aspectRatio="16/9" />
    {/if}
  </div>
  <div class="body">
    <div class="labels">
      {#each labels.slice(0, 2) as label}
        <div class="label">{label}</div>
      {/each}
      {#if labels.length > 2}
        <div class="label">+</div>
      {/if}
    </div>
    <h2 class="title">{formatTitle(result.title)}</h2>
    <div class="byline">
      {#if result.created}
        {formatDate(result.created)}
      {/if}
    </div>
  </div>
</div>
