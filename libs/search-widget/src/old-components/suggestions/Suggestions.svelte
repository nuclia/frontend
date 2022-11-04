<script lang="ts">
  import type { Classification, LinkField, Search } from '@nuclia/core';
  import { FIELD_TYPE } from '@nuclia/core';
  import { setDisplayedResource } from '../../core/old-stores/main.store';
  import { getField } from '../../core/api';
  import { getCDN, goToUrl } from '../../core/utils';
  import { _ } from '../../core/i18n';
  import { DisplayedResource, FieldType }  from '../../core/models';
  import { suggestionsHasError } from '../../core/stores/suggestions.store';
  import { navigateToLink } from '../../core/stores/widget.store';

  export let paragraphs: Search.Paragraph[] = [];
  export let intents: Classification[] = [];
  let showMore = false;

  const goToResource = (params: DisplayedResource) => {
    if (navigateToLink.getValue() && params.paragraph?.field_type === FieldType.LINK) {
      getField(params.paragraph.rid, FIELD_TYPE.link, params.paragraph.field).subscribe((field) => {
        goToUrl((field.value as LinkField).uri);
      });
    }
    else {
      setDisplayedResource(params)
    }
  }
</script>

<div class="sw-suggestions">
  {#if $suggestionsHasError}
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
            on:click|preventDefault={() => goToResource({ uid: paragraph.rid, paragraph })}
            on:keyup={(e) => {
              if (e.key === 'Enter') goToResource({ uid: paragraph.rid, paragraph });
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
