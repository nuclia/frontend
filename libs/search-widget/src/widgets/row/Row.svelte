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
      <p class="byline">{formatDate(result.created)}</p>
    </div>
    <div class="block-3">
      {#if thumbnail}
        <div class="thumbnail">
          <img src={thumbnail} alt="Thumbnail" />
        </div>
      {/if}
      {#if result.summary}
        <h3>{$_('results.summary')}</h3>
        <div class="body">{result.summary}</div>
      {/if}
    </div>
    <div class="block-4">
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
  </div>
</div>

<style>
  .row {
    cursor: pointer;
    padding: 16px;
    margin-bottom: 50px;
    background-color: var(--color-light-stronger);
  }
  .row:focus,
  .row:hover {
    border-color: var(--color-dark-stronger);
    padding-left: 13px;
    border-left: 3px solid var(--color-neutral-strong);
    outline: 0px;
  }
  .title {
    font-weight: var(--font-weight-bold);
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

  h3 {
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
  .paragraph {
    margin: 8px 0 8px -16px;
    padding-left: 16px;
  }
  .paragraph:hover,
  .paragraph:focus {
    border-color: var(--color-dark-stronger);
    padding-left: 13px;
    border-left: 3px solid var(--color-neutral-strong);
    outline: 0px;
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
