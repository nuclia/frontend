<script lang="ts">
  import type { Search, Classification } from '@nuclia/core';
  import { nucliaState, setDisplayedResource } from '../../core/old-stores/main.store';
  import { getCDN } from '../../core/utils';
  import { _ } from '../../core/i18n';

  export let paragraphs: Search.Paragraph[] = [];
  export let intents: Classification[] = [];
  const hasSearchError = nucliaState().hasSearchError;
  let showMore = false;
</script>

<div class="sw-suggestions">
  {#if $hasSearchError}
    <div><strong>{$_('error.search')}</strong> <span>{$_('error.search-beta')}</span></div>
  {:else}
    <p>{$_('suggest.enter')}</p>
    {#if intents.length > 0}
      <h3>{$_('suggest.intents')}</h3>
      <ul class="intents">
        {#each intents as intent}
          <li>
            {intent.label}
          </li>
        {/each}
      </ul>
    {/if}
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
</div>

<style lang="scss" src="./Suggestions.scss"></style>
