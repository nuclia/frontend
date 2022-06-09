<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { IResource } from '@nuclia/core';
  import { formatDate } from '../../core/utils';
  import { _ } from '../../core/i18n';
  import { nucliaState, setDisplayedResource } from '../../core/store';
  import { getFile } from '../../core/api';
  import MimeIcon from '../../components/icons/mime.svelte';

  export let result: IResource;
  const paragraphs = nucliaState().getMatchingParagraphs(result.id);
  const sentences = nucliaState().getMatchingSentences(result.id);
  let thumbnail;
  if (result.thumbnail) {
    getFile(result.thumbnail).subscribe((url) => (thumbnail = url));
  }

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
      <MimeIcon type={result.icon} />
    </div>
    <div class="block-2">
      <h2 class="title">{decodeURIComponent(result.title || '–')}</h2>
      <div class="byline">
        {#if result.created}
          {formatDate(result.created)}
        {/if}
      </div>
    </div>
    <div class="block-3">
      {#if thumbnail}
        <div class="thumbnail">
          <img src={thumbnail} alt="Thumbnail" />
        </div>
      {/if}
      {#if result.summary}
        <h3>{$_('results.summary')}</h3>
        <div class="summary">{result.summary}</div>
      {/if}
    </div>
    <div class="block-4">
      {#if $sentences.length > 0}
        <div class="paragraph-list">
          <h3>{$_('results.semantic')}</h3>
          {#each $sentences as sentence}
            <div
              class="paragraph"
              on:click|preventDefault|stopPropagation={() => setDisplayedResource({ uid: sentence.rid, sentence })}
            >
              {sentence.text}
            </div>
          {/each}
        </div>
      {/if}
      {#if $paragraphs.length > 0}
        <div class="paragraph-list">
          <h3>{$_('results.paragraphs')}</h3>
          {#each $paragraphs as paragraph}
            <div
              class="paragraph"
              on:click|preventDefault|stopPropagation={() => setDisplayedResource({ uid: paragraph.rid, paragraph })}
            >
              {paragraph.text}
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .row {
    cursor: pointer;
    padding: 16px;
    margin-bottom: 40px;
    background-color: var(--color-light-stronger);
  }
  .row:focus-visible {
    border-color: var(--color-dark-stronger);
    padding-left: 13px;
    border-left: 3px solid var(--color-neutral-strong);
    outline: 0px;
  }
  .title {
    margin-bottom: 0.4em;
    font-weight: var(--font-weight-bold);
  }
  .byline {
    font-size: 12px;
    font-style: italic;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--color-primary-regular);
  }

  .blocks {
    display: grid;
    grid-template-columns: 46px auto;
  }
  .block-1 {
    padding-top: 20px;
  }
  .block-4,
  .block-3 {
    grid-column: span 2;
  }
  .block-3 {
    border-left: 1px solid var(--color-dark-light);
    padding: 10px;
    margin: 10px;
  }
  @media (min-width: 640px) {
    .block-2,
    .block-4 {
      padding-right: 30px;
    }
  }

  .block-4 h3 {
    margin: 2em 0 0 0;
    font-size: 12px;
    text-transform: uppercase;
  }

  .thumbnail {
    position: relative;
    width: 100%;
    height: 0;
    padding-top: 50%;
  }
  .thumbnail img {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: top;
  }
  .summary {
    display: -webkit-box;
    -webkit-line-clamp: 4;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .paragraph-list:not(:last-child) {
    padding-bottom: 12px;
    border-bottom: 1px solid var(--color-primary-regular);
  }
  .paragraph {
    position: relative;
    padding: 16px 0;
    border-bottom: 1px dashed rgba(0, 0, 0, 0.2);
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
    top: 8px;
    bottom: 8px;
    left: -16px;
    border-color: var(--color-dark-stronger);
    border-left: 3px solid var(--color-neutral-strong);
  }

  @media (min-width: 640px) {
    .blocks {
      display: grid;
      grid-template-columns: 46px calc(75% - 46px) 25%;
    }
    .block-4 {
      grid-column: 2 / 2;
    }
    .block-3 {
      grid-row: span 2;
      grid-column: span 1;
    }
  }
</style>
