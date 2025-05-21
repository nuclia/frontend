<script lang="ts">
  import { preventDefault } from 'svelte/legacy';

  import type { Search } from '@nuclia/core';
  import { ResourceProperties } from '@nuclia/core';
  import { _, getResourceById, goToUrl, suggestionError, suggestionsHasError } from '../../../../core';

  interface Props {
    paragraphs?: Search.Paragraph[];
  }

  let { paragraphs = [] }: Props = $props();

  const goToResource = (paragraph: Search.Paragraph) => {
    getResourceById(paragraph.rid, [
      ResourceProperties.BASIC,
      ResourceProperties.ORIGIN,
      ResourceProperties.VALUES,
    ]).subscribe((resource) => {
      if (resource.origin?.url) {
        goToUrl(resource.origin.url);
      } else if (resource.data?.links?.link?.value?.uri) {
        goToUrl(resource.data?.links.link.value.uri);
      } else {
        console.log(resource.data);
      }
    });
  };
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
  {:else if paragraphs.length > 0}
    <section>
      <div>
        {#each paragraphs.slice(0, 4) as paragraph}
          <div
            class="paragraph"
            onclick={preventDefault(() => goToResource(paragraph))}
            onkeyup={(e) => {
              if (e.key === 'Enter') goToResource(paragraph);
            }}
            tabindex="0">
            {paragraph.text}
          </div>
        {/each}
      </div>
    </section>
  {/if}
</div>

<style
  lang="scss"
  src="./Suggestions.scss"></style>
