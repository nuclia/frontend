<script lang="ts">
  import type { Classification, IResource, ResourceField, Search } from '@nuclia/core';
  import { ResourceProperties } from '@nuclia/core';
  import Label from '../../common/label/Label.svelte';
  import Chip from '../../common/chip/Chip.svelte';
  import { combineLatest, iif, map, of, switchMap, take, tap } from 'rxjs';
  import type { TypedResult } from '../../core';
  import {
    _,
    addLabelFilter,
    autocompleteFromNERs,
    getFieldDataFromResource,
    getFirstResourceField,
    getNavigationUrl,
    getResourceById,
    getResultType,
    goToUrl,
    navigateToFile,
    navigateToLink,
    navigateToOriginURL,
    NO_SUGGESTION_RESULTS,
    openNewTab,
    permalink,
    selectedEntity,
    suggestionError,
    suggestions,
    suggestionsHasError,
    viewerData,
  } from '../../core';
  import { createEventDispatcher } from 'svelte';

  export let paragraphs: Search.Paragraph[] = [];
  export let entities: { family: string; value: string }[] = [];
  export let labels: Classification[] = [];

  const dispatch = createEventDispatcher();

  const goToResource = (paragraph: Search.Paragraph) => {
    getResourceById(paragraph.rid, [ResourceProperties.BASIC, ResourceProperties.ORIGIN, ResourceProperties.VALUES])
      .pipe(
        switchMap((resource) => {
          const firstResourceField = getFirstResourceField(resource);
          return combineLatest([navigateToFile, navigateToLink, navigateToOriginURL, openNewTab, permalink]).pipe(
            take(1),
            switchMap(([navigateToFile, navigateToLink, navigateToOriginURL, openNewTab, permalink]) =>
              iif(
                () => (navigateToFile || navigateToLink || openNewTab) && !!firstResourceField,
                getNavigationUrl(
                  navigateToFile,
                  navigateToLink,
                  navigateToOriginURL,
                  openNewTab,
                  permalink,
                  resource,
                  firstResourceField as ResourceField,
                ),
                of(false),
              ),
            ),
            switchMap((url) =>
              openNewTab.pipe(
                take(1),
                map((openNewTab) => ({ url, resource, openNewTab })),
              ),
            ),
            tap(({ url, resource, openNewTab }) => {
              if (url) {
                goToUrl(url, openNewTab);
              } else {
                openViewer(resource, firstResourceField);
              }
              suggestions.set({ results: NO_SUGGESTION_RESULTS });
            }),
          );
        }),
      )
      .subscribe();
  };

  function openViewer(resource: IResource, field?: ResourceField) {
    if (field) {
      const fieldData = getFieldDataFromResource(resource, field);
      const { resultType, resultIcon } = getResultType({ ...resource, field, fieldData });
      const result: TypedResult = {
        ...resource,
        resultType,
        resultIcon,
        field: { field_id: field.field_id, field_type: field.field_type },
      };
      viewerData.set({
        result,
        selectedParagraphIndex: -1,
      });
    }
  }
</script>

<div class="sw-suggestions">
  {#if $suggestionsHasError}
    <div class="error-message">
      {#if $suggestionError.status === 402}
        <p>{$_('error.feature-blocked')}</p>
      {:else}
        <strong>{$_('error.search')}</strong>
      {/if}
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
                on:click={() => addLabelFilter(label, [])} />
            </li>
          {/each}
        </ul>
      </section>
    {/if}
    {#if entities.length > 0 && $autocompleteFromNERs}
      <section>
        <h3>{$_('suggest.entities')}</h3>
        <ul class="entities">
          {#each entities as entity}
            <li>
              <Chip
                color={$selectedEntity?.family === entity.family && $selectedEntity?.value === entity.value
                  ? 'var(--color-neutral-lighter)'
                  : 'var(--color-neutral-lightest)'}
                clickable
                on:click={() => dispatch('autocomplete', entity)}>
                {entity.value}
              </Chip>
            </li>
          {/each}
        </ul>
      </section>
    {/if}
    {#if paragraphs.length > 0}
      <section>
        <h3>{$_('suggest.titles')}</h3>
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
