<script lang="ts">
  import type { Classification, Search } from '@nuclia/core';
  import { ResourceProperties } from '@nuclia/core';
  import { getResourceById } from '../../core/api';
  import { getExternalUrl, goToUrl, isYoutubeUrl } from '../../core/utils';
  import { _ } from '../../core/i18n';
  import { DisplayedResource, NO_RESULTS } from '../../core/models';
  import { suggestionsHasError, suggestions } from '../../core/stores/suggestions.store';
  import { navigateToLink } from '../../core/stores/widget.store';
  import Label from '../../common/label/Label.svelte';
  import { of, switchMap, take } from 'rxjs';
  import { addLabelFilter, displayedResource } from '../../core/stores/search.store';

  export let paragraphs: Search.Paragraph[] = [];
  export let labels: Classification[] = [];

  const goToResource = (params: DisplayedResource, text: string) => {
    navigateToLink
      .pipe(
        take(1),
        switchMap((navigateToLink) =>
          navigateToLink
            ? getResourceById(params.uid, [ResourceProperties.BASIC, ResourceProperties.VALUES])
            : of(null),
        ),
      )
      .subscribe((resource) => {
        const url = resource && getExternalUrl(resource);
        if (url && !isYoutubeUrl(url)) {
          goToUrl(url, text);
        } else {
          displayedResource.set(params);
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
              on:click|preventDefault={() => goToResource({ uid: paragraph.rid }, paragraph.text)}
              on:keyup={(e) => {
                if (e.key === 'Enter') goToResource({ uid: paragraph.rid }, paragraph.text);
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
