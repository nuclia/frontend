<script lang="ts">
  import type { Classification, LinkField, Search } from '@nuclia/core';
  import { FIELD_TYPE } from '@nuclia/core';
  import { setDisplayedResource } from '../../core/old-stores/main.store';
  import { getField } from '../../core/api';
  import { goToUrl } from '../../core/utils';
  import { _ } from '../../core/i18n';
  import { DisplayedResource, FieldType } from '../../core/models';
  import { suggestionsHasError } from '../../core/stores/suggestions.store';
  import { navigateToLink } from '../../core/stores/widget.store';

  export let paragraphs: Search.Paragraph[] = [];
  export let intents: Classification[] = [];

  const goToResource = (params: DisplayedResource) => {
    if (navigateToLink.getValue() && params.paragraph?.field_type === FieldType.LINK) {
      getField(params.paragraph.rid, FIELD_TYPE.link, params.paragraph.field).subscribe((field) => {
        goToUrl((field.value as LinkField).uri);
      });
    } else {
      setDisplayedResource(params);
    }
  };
</script>

<div class="sw-suggestions">
  {#if $suggestionsHasError}
    <div><strong>{$_('error.search')}</strong> <span>{$_('error.search-beta')}</span></div>
  {:else}
    {#if intents.length > 0}
      <section>
        <h3>{$_('suggest.intents')}</h3>
        <ul class="intents">
          {#each intents as intent}
            <li>
              {intent.label}
            </li>
          {/each}
        </ul>
      </section>
    {/if}
    {#if paragraphs.length > 0}
      <section>
        <h3>{$_('suggest.paragraphs')}</h3>
        <div>
          {#each paragraphs.slice(0, 4) as paragraph}
            <div class="paragraph"
                 on:click|preventDefault={() => goToResource({ uid: paragraph.rid, paragraph })}
                 on:keyup={(e) => { if (e.key === 'Enter') goToResource({ uid: paragraph.rid, paragraph }); }}
                 tabindex="0">
              {paragraph.text}
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style lang="scss" src="./Suggestions.scss"></style>
