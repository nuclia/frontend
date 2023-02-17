<script lang="ts">
  import type { Classification, Search } from '@nuclia/core';
  import { FIELD_TYPE, ResourceProperties, shortToLongFieldType } from '@nuclia/core';
  import { getResourceById, getResourceField } from '../../core/api';
  import { getExternalUrl, goToUrl, isYoutubeUrl } from '../../core/utils';
  import { _ } from '../../core/i18n';
  import { FieldFullId, NO_RESULTS } from '../../core/models';
  import { suggestionsHasError, suggestions } from '../../core/stores/suggestions.store';
  import { navigateToLink } from '../../core/stores/widget.store';
  import Label from '../../common/label/Label.svelte';
  import { forkJoin, of, switchMap, take } from 'rxjs';
  import { addLabelFilter, displayedResource } from '../../core/stores/search.store';

  export let paragraphs: Search.Paragraph[] = [];
  export let labels: Classification[] = [];

  const goToResource = (paragraph: Search.Paragraph) => {
    const text = paragraph.text;
    const fullId: FieldFullId = {
      resourceId: paragraph.rid,
      field_type: shortToLongFieldType(paragraph.field_type) as FIELD_TYPE,
      field_id: paragraph.field,
    };
    navigateToLink
      .pipe(
        take(1),
        switchMap((navigateToLink) =>
          navigateToLink
            ? forkJoin([getResourceById(paragraph.rid, [ResourceProperties.ORIGIN]), getResourceField(fullId)])
            : of(null),
        ),
      )
      .subscribe(([resource, field]) => {
        const url = resource && getExternalUrl(resource, field);
        if (url && !isYoutubeUrl(url)) {
          goToUrl(url, text);
        } else {
          // to be removed once old widget will be gone
          displayedResource.set({ uid: paragraph.rid });
        }
        suggestions.set({ results: NO_RESULTS });
      });
  };
</script>

<div class="sw-suggestions">
  {#if $suggestionsHasError}
    <div>
      <strong>{$_('error.search')}</strong>
      <span>{$_('error.search-beta')}</span>
    </div>
  {:else}
    {#if labels.length > 0}
      <section>
        <h3>{$_('suggest.intents')}</h3>
        <ul class="intents">
          {#each labels as label}
            <li>
              <Label
                {label}
                clickable
                on:click={() => addLabelFilter(label)} />
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
            <div
              class="paragraph"
              on:click|preventDefault={() => goToResource(paragraph)}
              on:keyup={(e) => {
                if (e.key === 'Enter') goToResource(paragraph);
              }}
              tabindex="0">
              {paragraph.text}
            </div>
          {/each}
        </div>
      </section>
    {/if}
  {/if}
</div>

<style
  lang="scss"
  src="./Suggestions.scss"></style>
