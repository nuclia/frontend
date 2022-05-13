<script lang="ts">
  import type { Search } from '@nuclia/core';
  import { nucliaState, setDisplayedResource } from '../../core/store';
  import { getCDN } from '../../core/utils';
  import { _ } from '../../core/i18n';

  export let paragraphs: Search.Paragraph[] = [];
  const hasSearchError = nucliaState().hasSearchError;
  let showMore = false;
</script>

{#if $hasSearchError}
  <div><strong>{$_('error.search')}</strong> <span>{$_('error.search-beta')}</span></div>
{:else}
  <p>{$_('suggest.enter')}</p>
  {#if paragraphs.length > 0}
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
      {#if !showMore && paragraphs.length > 4}
        <span
          class="show-more"
          tabindex="0"
          on:click={() => (showMore = true)}
          on:keyup={(e) => {
            if (e.key === 'Enter') showMore = true;
          }}
        >
          <img src={`${getCDN()}icons/guillemet.svg`} alt="icon" />
          <span>{$_('suggest.more')}</span>
        </span>
      {/if}
    </div>
  {/if}
{/if}

<style>
  h3 {
    text-transform: uppercase;
    margin: 0 0 1em 1.3em;
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
  .show-more {
    display: inline-block;
    margin: 6px 0 0 16px;
    cursor: pointer;
  }
  .show-more span {
    vertical-align: middle;
    padding-left: 4px;
    font-size: 15px;
    font-style: italic;
  }
  .show-more:hover span {
    text-decoration: underline;
  }
  p {
    text-align: right;
    font-size: small;
    color: var(--color-primary-muted);
    margin: 0;
  }
</style>
