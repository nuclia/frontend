<script lang="ts">
  import type { Search } from '@nuclia/core';
  import { ReadableResource } from '@nuclia/core';
  import { formatDate, formatTitle } from '../../core/utils';
  import { _ } from '../../core/i18n';
  import MimeIcon from '../../common/icons/MimeIcon.svelte';
  import Thumbnail from '../../common/thumbnail/Thumbnail.svelte';
  import AllResultsToggle from '../../common/paragraph-result/AllResultsToggle.svelte';
  import Label from '../../common/label/Label.svelte';
  import Dropdown from '../../common/dropdown/Dropdown.svelte';
  import Button from '../../common/button/Button.svelte';
  import { searchBy } from '../../common/label/label.utils';
  import { goToResource } from '../results/results.utils';

  export let displayThumbnail = true;
  export let formWidget = false;
  export let result: Search.SmartResult;
  const paragraphs = result.paragraphs || [];
  let showAllResults = false;

  $: labels = new ReadableResource(result).getClassifications();

  const labelDisplayLimit = 4;
  let displayMoreLabels = false;
  let moreLabelsButton: HTMLElement | undefined;
  let moreLabelsPosition: { left: number; top: number } | undefined;

  const showMoreLabels = (event) => {
    event.stopPropagation();
    if (moreLabelsButton) {
      moreLabelsPosition = { left: 0, top: moreLabelsButton.clientHeight + 6 };
      displayMoreLabels = true;
    }
  };
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
      {#if paragraphs.length > 0}
        <ul class="paragraph-list">
          {#each paragraphs as paragraph, index}
            {@const isSemantic = paragraph.sentences && paragraph.sentences.length > 0}
            {#if index < 4 || showAllResults}
              <li
                class="paragraph"
                class:semantic={isSemantic}
                on:click|preventDefault|stopPropagation={() =>
                  goToResource(
                    { uid: paragraph.rid, [isSemantic ? 'sentence' : 'paragraph']: paragraph },
                    paragraph.text,
                  )}>
                {@html paragraph.text}
              </li>
            {/if}
          {/each}
        </ul>
        {#if paragraphs.length > 4}
          <AllResultsToggle
            {showAllResults}
            on:toggle={() => (showAllResults = !showAllResults)} />
        {/if}
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
          {#each labels.slice(0, labelDisplayLimit) as label}
            <Label
              {label}
              clickable
              on:click={() => searchBy(label)} />
          {/each}
          {#if labels.length > labelDisplayLimit}
            <div
              class="more-labels"
              bind:this={moreLabelsButton}>
              <Button
                aspect="basic"
                size="small"
                active={displayMoreLabels}
                on:click={showMoreLabels}>
                {$_('results.more_labels', { count: labels.length - labelDisplayLimit })}
              </Button>
              {#if displayMoreLabels}
                <Dropdown
                  position={moreLabelsPosition}
                  on:close={() => (displayMoreLabels = false)}>
                  <div class="labels-dropdown">
                    {#each labels.slice(labelDisplayLimit) as label (label.labelset + label.label)}
                      <Label
                        {label}
                        clickable
                        on:click={() => searchBy(label)} />
                    {/each}
                  </div>
                </Dropdown>
              {/if}
            </div>
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
