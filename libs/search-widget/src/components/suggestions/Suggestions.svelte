<script lang="ts">
  import type { Classification, IResource, ResourceField, Search } from '@nuclia/core';
  import { ResourceProperties } from '@nuclia/core';
  import Label from '../../common/label/Label.svelte';
  import { combineLatest, iif, map, of, switchMap, take, tap } from 'rxjs';
  import {
    _,
    addLabelFilter,
    fieldFullId,
    getFirstResourceField,
    getNavigationUrl,
    getResourceById, getResultType,
    goToUrl,
    navigateToFile,
    navigateToLink,
    NO_RESULTS,
    suggestionError,
    suggestions,
    suggestionsHasError,
    viewerData
  } from "../../core";

  export let paragraphs: Search.Paragraph[] = [];
  export let labels: Classification[] = [];

  const goToResource = (paragraph: Search.Paragraph) => {
    getResourceById(paragraph.rid, [ResourceProperties.BASIC, ResourceProperties.ORIGIN, ResourceProperties.VALUES])
      .pipe(
        switchMap((resource) => {
          const firstResourceField = getFirstResourceField(resource);
          return combineLatest([navigateToFile, navigateToLink]).pipe(
            take(1),
            switchMap(([navigateToFile, navigateToLink]) => iif(
              () => (navigateToFile || navigateToLink) && !!firstResourceField,
              getNavigationUrl(
                navigateToFile,
                navigateToLink,
                resource,
                firstResourceField as ResourceField
              ),
              of(false)
            )),
            map((url) => ({ url, resource }))
          ).pipe(
            tap(({ url, resource }) => {
              if (url) {
                goToUrl(url);
              } else {
                openViewer(resource, firstResourceField);
              }
              suggestions.set({ results: NO_RESULTS });
            })
          );
        })
      ).subscribe();
  };

  function openViewer(resource: IResource, field?: ResourceField) {
    if (field) {
      viewerData.set({
        result: {
          ...resource,
          resultType: getResultType({...resource, field }),
          field: {field_id: field.field_id, field_type: field.field_type},
        },
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
