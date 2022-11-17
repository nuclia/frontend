<script lang="ts">
  import { IResource, ReadableResource } from '@nuclia/core';
  import { formatDate, formatTitle } from '../../core/utils';
  import { nucliaState } from '../../core/old-stores/main.store';
  import MimeIcon from '../../common/icons/MimeIcon.svelte';
  import Thumbnail from '../../common/thumbnail/Thumbnail.svelte';
  import Label from '../../common/label/Label.svelte';
  import { searchBy } from '../../common/label/label.utils';
  import { goToResource } from '../results/results.utils';

  export let displayThumbnail = true;
  export let formWidget = false;
  export let result: IResource;
  export let semantic = false;
  const paragraphs = nucliaState().getMatchingParagraphs(result.id);
  const sentences = nucliaState().getMatchingSentences(result.id);
  $: labels = new ReadableResource(result).getClassifications();
</script>

<div
  class="sw-row"
  on:click|preventDefault={() => goToResource({ uid: result.id })}
  on:keyup={(e) => {
    if (e.key === 'Enter') goToResource({ uid: result.id });
  }}
  on:focus
  tabindex="0">
  <div
    class="blocks"
    class:no-thumbnail={!displayThumbnail}>
    <div class="block-1">
      {#if result.icon}
        <MimeIcon
          type={result.icon}
          small />
      {/if}
    </div>
    <div class="block-2">
      <h2 class="title">{formatTitle(result.title)}</h2>
      {#if semantic && $sentences.length > 0}
        <ul class="paragraph-list">
          {#each $sentences as sentence}
            <li
              class="paragraph"
              on:click|preventDefault|stopPropagation={() =>
                goToResource({ uid: sentence.rid, sentence }, sentence.text)}>
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
              on:click|preventDefault|stopPropagation={() =>
                goToResource({ uid: paragraph.rid, paragraph }, paragraph.text)}>
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
            <Label
              {label}
              clickable
              on:click={() => searchBy(label)} />
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

<style
  lang="scss"
  src="./Row.scss"></style>
