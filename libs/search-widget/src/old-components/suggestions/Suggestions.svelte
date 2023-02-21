<script lang="ts">
  import type { Classification, IResource, ResourceField, Search } from '@nuclia/core';
  import { ResourceProperties } from '@nuclia/core';
  import { getResourceById } from '../../core/api';
  import { getExternalUrl, goToUrl, isYoutubeUrl } from '../../core/utils';
  import { _ } from '../../core/i18n';
  import { NO_RESULTS } from '../../core/models';
  import { suggestionsHasError, suggestions } from '../../core/stores/suggestions.store';
  import { navigateToLink } from '../../core/stores/widget.store';
  import Label from '../../common/label/Label.svelte';
  import { map, switchMap, take } from 'rxjs';
  import { addLabelFilter, displayedResource, getFirstResourceField } from '../../core/stores/search.store';
  import { fieldData, fieldFullId, resourceTitle } from '../../core/stores/viewer.store';

  export let paragraphs: Search.Paragraph[] = [];
  export let labels: Classification[] = [];

  const goToResource = (paragraph: Search.Paragraph) => {
    getResourceById(paragraph.rid, [ResourceProperties.BASIC, ResourceProperties.ORIGIN, ResourceProperties.VALUES])
      .pipe(
        switchMap((resource) =>
          navigateToLink.pipe(
            take(1),
            map((navigateToLink) => ({ navigateToLink, resource })),
          ),
        ),
      )
      .subscribe(({ navigateToLink, resource }) => {
        const resourceField = getFirstResourceField(resource);
        if (navigateToLink) {
          const url = getExternalUrl(resource, resourceField);
          if (url && !isYoutubeUrl(url)) {
            goToUrl(url, paragraph.text);
          } else {
            openViewer(resource, resourceField);
          }
        } else {
          openViewer(resource, resourceField);
        }
        suggestions.set({ results: NO_RESULTS });
      });
  };

  function openViewer(resource: IResource, field?: ResourceField) {
    if (field) {
      fieldFullId.set({ resourceId: resource.id, field_id: field.field_id, field_type: field.field_type });
      fieldData.set(field);
    }
    if (resource.title) {
      resourceTitle.set(resource.title);
    }
    // to be removed once old widget will be gone
    displayedResource.set({ uid: resource.id });
  }
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
