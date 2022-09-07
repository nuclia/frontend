<script lang="ts">
  import type { IResource } from '@nuclia/core';
  import { formatDate, formatTitle } from '../../core/utils';
  import { nucliaState, setDisplayedResource } from '../../core/store';
  import MimeIcon from '../../components/icons/mime.svelte';
  import Thumbnail from './Thumbnail.svelte';

  export let displayThumbnail = true;
  export let formWidget = false;
  export let result: IResource;
  export let semantic = false;
  const paragraphs = nucliaState().getMatchingParagraphs(result.id);
  const sentences = nucliaState().getMatchingSentences(result.id);
  let labels: string[];
  $: labels = (result.usermetadata?.classifications || []).map((label) => label.label);
</script>

<div
  class="sw-row"
  on:click|preventDefault={() => setDisplayedResource({ uid: result.id })}
  on:keyup={(e) => {
    if (e.key === 'Enter') setDisplayedResource({ uid: result.id });
  }}
  on:focus
  tabindex="0"
>
  <div class="blocks" class:no-thumbnail={!displayThumbnail}>
    <div class="block-1">
      {#if result.icon}
        <MimeIcon type={result.icon} small />
      {/if}
    </div>
    <div class="block-2">
      <h2 class="title">{formatTitle(result.title)}</h2>
      {#if semantic && $sentences.length > 0}
        <ul class="paragraph-list">
          {#each $sentences as sentence}
            <li
              class="paragraph"
              on:click|preventDefault|stopPropagation={() => setDisplayedResource({ uid: sentence.rid, sentence })}
            >
              {@html sentence.text}
            </li>
          {/each}
        </ul>
      {/if}
      {#if !semantic && $paragraphs.length > 0}
        <ul class="paragraph-list">
          {#each $paragraphs as paragraph}
            <li
              class="paragraph"
              on:click|preventDefault|stopPropagation={() => setDisplayedResource({ uid: paragraph.rid, paragraph })}
            >
              {@html paragraph.text}
            </li>
          {/each}
        </ul>
      {/if}
    </div>
    {#if displayThumbnail}
      <div class="block-3">
        <div class="byline">
          {#if result.created && !formWidget}
            {formatDate(result.created)}
          {/if}
        </div>
        <div class="labels">
          {#each labels.slice(0, 4) as label}
            <div class="label">{label}</div>
          {/each}
          {#if labels.length > 4}
            <div class="label">+</div>
          {/if}
        </div>
      </div>
    {/if}

    {#if displayThumbnail}
      <div class="block-4">
        {#if result.thumbnail}
          <Thumbnail src={result.thumbnail} />
        {/if}
      </div>
    {/if}
  </div>
</div>

<style lang="scss" src="./Row.scss"></style>
