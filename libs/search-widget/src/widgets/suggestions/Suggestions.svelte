<script lang="ts">
  import type { Search } from '@nuclia/core';
  import { nucliaState, setDisplayedResource } from '../../core/store';
  import { _ } from '../../core/i18n';

  export let paragraphs: Search.Paragraph[] = [];
  const hasSearchError = nucliaState().hasSearchError;
  let showMore = false;
</script>

{#if $hasSearchError}
  <div><strong>{$_('error.search')}</strong> <span>{$_('error.search-beta')}</span></div>
{:else}
  <p>{$_('suggest.enter')}</p>
  <h3>{$_('suggest.paragraphs')}</h3>
  <div>
    {#each paragraphs.slice(0, showMore ? -1 : 4) as paragraph}
      <div
        class="paragraph"
        on:click|preventDefault={() => setDisplayedResource({ uid: paragraph.rid, paragraph })}
        on:keyup={(e) => {
          if (e.key === 'Enter') setDisplayedResource({ uid: paragraph.rid, paragraph });
        }}
        tabindex="0"
      >
        {paragraph.text}
      </div>
    {/each}
    {#if !showMore && paragraphs.length > 4}<small on:click={() => (showMore = true)}>{$_('suggest.more')}</small>{/if}
  </div>
{/if}

<style>
  h3 {
    text-transform: uppercase;
    margin-left: 0 1.3em 1em 0;
    font-size: 12px;
  }
  .paragraph {
    font-size: 15px;
    line-height: 18px;
    margin: 10px 12px 10px -16px;
    padding-left: 32px;
    cursor: pointer;
  }
  .paragraph:hover,
  .paragraph:focus {
    border-color: var(--color-dark-stronger);
    padding-left: 29px;
    border-left: 3px solid var(--color-neutral-strong);
    outline: 0px;
  }
  small {
    cursor: pointer;
    font-weight: var(--font-weight-bold);
    color: var(--color-neutral-strong);
    padding-left: 16px;
  }
  p {
    text-align: right;
    font-size: small;
    margin: 0;
  }
</style>
