<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { IResource } from '@nuclia/core';
  import { formatDate } from '../../core/utils';
  import { nucliaState, setDisplayedResource } from '../../core/store';
  import { getFile } from '../../core/api';
  import MimeIcon from '../../components/icons/mime.svelte';

  export let formWidget = false;
  export let result: IResource;
  export let semantic = false;
  const paragraphs = nucliaState().getMatchingParagraphs(result.id);
  const sentences = nucliaState().getMatchingSentences(result.id);
  let thumbnail: string;
  if (result.thumbnail) {
    getFile(result.thumbnail).subscribe((url) => (thumbnail = url));
  }
  let labels: string[];
  $: labels = (result.usermetadata?.classifications || []).map((label) => label.label);

  onDestroy(() => {
    if (thumbnail) URL.revokeObjectURL(thumbnail);
  });
</script>

<div
  class="row"
  on:click|preventDefault={() => setDisplayedResource({ uid: result.id })}
  on:keyup={(e) => {
    if (e.key === 'Enter') setDisplayedResource({ uid: result.id });
  }}
  on:focus
  tabindex="0"
>
  <div class="blocks">
    <div class="block-1">
      {#if result.icon}
        <MimeIcon type={result.icon} small />
      {/if}
    </div>
    <div class="block-2">
      <h2 class="title">{decodeURIComponent(result.title || '–')}</h2>
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
    <div class="block-4">
      {#if thumbnail}
        <div class="thumbnail" class:semantic>
          <img src={thumbnail} alt="Thumbnail" />
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .row {
    cursor: pointer;
  }
  .row:focus-visible {
    padding-left: 13px;
    border-left: 3px solid var(--color-primary-regular);
    outline: 0px;
  }
  .title {
    margin: 0 0 0.75em 0;
    font-size: 1.125em;
    font-weight: var(--font-weight-bold);
  }
  .byline {
    font-size: 0.75em;
  }
  .labels {
    margin-top: 0.5em;
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

  .blocks {
    display: grid;
    grid-template-columns: 46px auto;
    grid-template-rows: min-content;
  }
  .block-3 {
    grid-row: 2/2;
    grid-column: 2/2;
  }
  .block-4 {
    display: none;
  }
  @media (min-width: 640px) {
    .blocks {
      grid-template-columns: 46px auto 200px;
      grid-template-rows: min-content;
    }
    .block-2 {
      padding-right: 30px;
    }
    .block-3 {
      grid-row: auto;
      grid-column: auto;
      padding-top: 0.25em;
      padding-right: 30px;
    }
  }
  @media (min-width: 1024px) {
    .blocks {
      grid-template-columns: 60px auto min(22%, 290px) 220px;
    }
    .block-4 {
      display: block;
    }
  }
  .thumbnail {
    position: relative;
    width: 100%;
    height: 0;
    padding-top: 80%;
    background-color: var(--color-neutral-lightest);
  }
  .thumbnail.semantic {
    background-color: #f0f0f0;
  }
  .thumbnail img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: contain;
    object-position: center;
    padding: 0.75em;
    box-sizing: border-box;
  }
  .paragraph-list {
    padding: 0 0 0 1em;
  }
  .paragraph {
    position: relative;
    margin: 0 0 0.5em 0;
  }
  .paragraph:last-child {
    border-bottom: 0;
  }
  .paragraph:focus {
    outline: 0px;
  }
  .paragraph:hover::before,
  .paragraph:focus::before {
    content: '';
    position: absolute;
    top: 4px;
    bottom: 4px;
    left: -30px;
    border-left: 3px solid var(--color-primary-regular);
  }
</style>
