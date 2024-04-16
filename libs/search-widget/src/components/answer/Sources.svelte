<script lang="ts">
  import type { ResourceField, Search } from '@nuclia/core';
  import { combineLatest, of, switchMap, take } from 'rxjs';
  import { ParagraphResult } from '../../common';
  import {
    getNavigationUrl,
    goToUrl,
    navigateToFile,
    navigateToLink,
    trackingEngagement,
    type TypedResult,
    viewerData,
  } from '../../core';

  export let sources: TypedResult[] = [];

  function clickOnSource(result: TypedResult, paragraph?: Search.FindParagraph) {
    trackingEngagement.set({ type: 'RESULT', rid: result.id, paragraph });
    combineLatest([navigateToFile, navigateToLink])
      .pipe(
        take(1),
        switchMap(([toFile, toLink]) => {
          if (result.field) {
            const resourceField: ResourceField = { ...result.field, ...result.fieldData };
            return toFile || toLink ? getNavigationUrl(toFile, toLink, result, resourceField) : of(undefined);
          }
          return of(undefined);
        }),
      )
      .subscribe((url) => {
        if (url) {
          goToUrl(url, paragraph?.text);
        } else {
          viewerData.set({
            result,
            selectedParagraphIndex: 0,
          });
        }
      });
  }
</script>

<div class="sw-sources">
  {#each sources as source, i}
    <div class="source">
      <div class="number body-m">{i + 1}</div>
      <div class="paragraph">
        {#if source.paragraphs?.[0]}
          <ParagraphResult
            resultType={source.resultType}
            paragraph={source.paragraphs[0]}
            ellipsis={true}
            noIndicator
            on:open={() => clickOnSource(source, source.paragraphs?.[0])}>
          </ParagraphResult>
        {/if}
        <div class="resource-title body-s">{source.title}</div>
      </div>
    </div>
  {/each}
</div>

<style
  lang="scss"
  src="./Sources.scss"></style>
