<script lang="ts">
  import { preventDefault } from 'svelte/legacy';

  import type { ResourceField, Search } from '@nuclia/core';
  import { combineLatest, forkJoin, of, switchMap, take } from 'rxjs';
  import {
    AllResultsToggle,
    DocTypeIndicator,
    Icon,
    IconButton,
    isMobileViewport,
    ParagraphResult,
    Thumbnail,
    ThumbnailPlayer,
  } from '../../common';
  import Expander from '../../common/expander/Expander.svelte';
  import type { TypedResult } from '../../core';
  import {
    collapseTextBlocks,
    displayMetadata,
    expandTextBlocks,
    feedbackOnResults,
    getAttachedImageTemplate,
    getNavigationUrl,
    getThumbnailInfos,
    goToUrl,
    hideAnswer,
    hideThumbnails,
    isAnswerEnabled,
    navigateToFile,
    navigateToLink,
    navigateToOriginURL,
    openNewTab,
    permalink,
    previewBaseUrl,
    trackingEngagement,
    viewerData,
    widgetViewerEnabled,
  } from '../../core';
  import { showAttachedImages } from '../../core/stores/search.store';
  import Feedback from '../answer/Feedback.svelte';
  import Image from '../image/Image.svelte';
  import { FieldMetadata } from './';

  const NUM_PARAGRAPHS = 4;

  interface Props {
    result: TypedResult;
    selected?: number;
    isSource?: boolean;
    answerRank: number | undefined;
  }

  let { result, selected = 0, isSource = false, answerRank }: Props = $props();

  let thumbnailLoaded = $state(false);

  let thumbnailInfo = $derived(getThumbnailInfos(result));
  let innerWidth = $state(window.innerWidth);
  let toggledParagraphHeights: { [id: string]: number } = $state({});
  let nonToggledParagraphCount = $state(NUM_PARAGRAPHS);
  let toggledParagraphTotalHeight = $state(0);
  let metaKeyOn = false;
  let expanded = $derived(!$collapseTextBlocks || selected > 0);
  let isMobile = $derived(isMobileViewport(innerWidth));
  let paragraphs = $derived(result.paragraphs || []);
  let isSelectedHidden = $derived(
    paragraphs.findIndex((paragraph) => paragraph.rank === selected) > NUM_PARAGRAPHS - 1,
  );
  let showAllResults = $derived($collapseTextBlocks || $expandTextBlocks || isSelectedHidden);
  let enableAllResultsToggle = $derived(
    paragraphs.length > NUM_PARAGRAPHS && !$collapseTextBlocks && !$expandTextBlocks,
  );

  $effect(() => {
    if (showAllResults) {
      toggledParagraphTotalHeight = Object.values(toggledParagraphHeights).reduce((acc, height) => acc + height, 0);
      nonToggledParagraphCount = paragraphs.length - Object.keys(toggledParagraphHeights).length;
    } else {
      const visibleParagraphs = paragraphs.slice(0, NUM_PARAGRAPHS).map((p) => p.id);
      const visibleToggledParagraphs = Object.entries(toggledParagraphHeights).filter(([id]) =>
        visibleParagraphs.includes(id),
      );
      toggledParagraphTotalHeight = Object.values(visibleToggledParagraphs).reduce(
        (acc, [id, height]) => acc + height,
        0,
      );
      nonToggledParagraphCount = visibleParagraphs.length - visibleToggledParagraphs.length;
    }
  });

  const url = getUrl();
  const IMAGE_PLACEHOLDER = '__IMAGE_PATH__';
  const imageTemplate = getAttachedImageTemplate(IMAGE_PLACEHOLDER);

  function clickOnResult(paragraph?: Search.FindParagraph, index?: number) {
    trackingEngagement.set({ type: 'RESULT', rid: result.id, paragraph });
    forkJoin([getUrl(paragraph), openNewTab.pipe(take(1)), widgetViewerEnabled.pipe(take(1))]).subscribe(
      ([_url, openNewTab, viewerEnabled]) => {
        if (_url) {
          goToUrl(_url, metaKeyOn || openNewTab);
        } else if (viewerEnabled) {
          if (result.field) {
            viewerData.set({
              result,
              selectedParagraphIndex: typeof index === 'number' ? index : -1,
            });
          }
        }
      },
    );
  }

  function getUrl(paragraph?: Search.FindParagraph) {
    return combineLatest([
      navigateToFile,
      navigateToLink,
      navigateToOriginURL,
      openNewTab,
      permalink,
      previewBaseUrl,
    ]).pipe(
      take(1),
      switchMap(([toFile, toLink, toOrigin, newTab, permalink, baseUrl]) => {
        const resourceField: ResourceField | undefined = result.field
          ? { ...result.field, ...result.fieldData }
          : undefined;
        return toFile || toLink || toOrigin || newTab
          ? getNavigationUrl(toFile, toLink, toOrigin, newTab, permalink, baseUrl, result, resourceField, paragraph)
          : of(undefined);
      }),
    );
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Meta' || event.key === 'Control') {
      metaKeyOn = true;
    }
  }

  function onKeyUp(event: KeyboardEvent) {
    if (event.key === 'Meta' || event.key === 'Control') {
      metaKeyOn = false;
    }
  }
</script>

<svelte:window
  bind:innerWidth
  onkeydown={onKeyDown}
  onkeyup={onKeyUp} />

<div
  class="sw-result-row"
  data-nuclia-rid={result.id}>
  {#if !$hideThumbnails}
    <div
      class="thumbnail-container"
      hidden={!expanded}>
      {#if thumbnailInfo.isPlayable}
        <ThumbnailPlayer
          thumbnail={result.thumbnail}
          fallback={thumbnailInfo.fallback}
          hasBackground={!result.thumbnail}
          aspectRatio="5/4"
          on:loaded={() => (thumbnailLoaded = true)}
          on:play={() => clickOnResult()} />
      {:else}
        <Thumbnail
          src={result.thumbnail}
          fallback={thumbnailInfo.fallback}
          aspectRatio="5/4"
          clickable
          on:loaded={() => (thumbnailLoaded = true)}
          on:click={() => clickOnResult()} />
      {/if}
      <div class="doc-type-container">
        <DocTypeIndicator type={result.resultType} />
      </div>
    </div>
  {/if}
  <div
    class="result-container"
    class:no-citations={$hideAnswer}>
    <div class="result-title-container">
      {#if $collapseTextBlocks}
        <IconButton
          aspect="basic"
          size="small"
          icon={expanded ? 'chevron-down' : 'chevron-right'}
          ariaLabel={expanded ? 'collapse' : 'expand'}
          on:click={() => {
            expanded = !expanded;
          }} />
      {/if}
      <div class="result-icon">
        <Icon name={thumbnailInfo.fallback} />
      </div>
      <h3
        class="ellipsis title-m result-title"
        class:no-thumbnail={$hideThumbnails}>
        {#if isSource && result.ranks}
          <div class="rank-container">
            {#each result.ranks as rank}
              <div
                class="number body-m"
                class:selected={selected === rank}
                data-scroll-ref={rank}>
                {rank}
              </div>
            {/each}
          </div>
        {/if}
        {#if $url}
          <a
            href={$url}
            onclick={preventDefault(() => clickOnResult())}>
            {result?.title}
          </a>
        {:else if $widgetViewerEnabled}
          <span
            tabindex="0"
            onclick={() => clickOnResult()}
            onkeyup={(e) => {
              if (e.key === 'Enter') clickOnResult();
            }}>
            {result?.title}
          </span>
        {:else}
          {result?.title}
        {/if}
      </h3>
    </div>
    {#if $displayMetadata}
      <FieldMetadata {result} />
    {/if}

    <Expander
      {expanded}
      duration={0}>
      <div tabindex="-1">
        <ul
          class="sw-paragraphs-container"
          class:expanded={showAllResults}
          class:can-expand={paragraphs.length > NUM_PARAGRAPHS}
          style:--non-toggled-paragraph-count={nonToggledParagraphCount}
          style:--toggled-paragraph-height={`${toggledParagraphTotalHeight}px`}>
          {#each paragraphs as paragraph, index}
            <div class="paragraph-container">
              <div
                class="paragraph-result-container"
                class:with-image={$showAttachedImages && paragraph.reference}>
                {#if isSource && paragraph.rank}
                  <div
                    class="number body-m"
                    class:selected={selected === paragraph.rank}
                    data-scroll-ref={paragraph.rank}>
                    {paragraph.rank}
                  </div>
                {/if}
                <ParagraphResult
                  {paragraph}
                  resultType={result.resultType}
                  expanded={$collapseTextBlocks}
                  ellipsis={true}
                  disabled={!$url && !$widgetViewerEnabled}
                  minimized={isMobile}
                  on:open={() => clickOnResult(paragraph, index)}
                  on:paragraphHeight={(event) => (toggledParagraphHeights[paragraph.id] = event.detail)} />
                {#if answerRank !== undefined && $isAnswerEnabled && $feedbackOnResults}
                  <div class="feedback-container">
                    <Feedback
                      size="xsmall"
                      rank={answerRank}
                      {paragraph} />
                  </div>
                {/if}
              </div>
              {#if $showAttachedImages && paragraph.reference}
                <Image
                  path={$imageTemplate.replace(
                    IMAGE_PLACEHOLDER,
                    `${result.id}/${result.field?.field_type}/${result.field?.field_id}/download/extracted/generated/${paragraph.reference}`,
                  )} />
              {/if}
            </div>
          {/each}
        </ul>

        {#if enableAllResultsToggle}
          <AllResultsToggle
            {showAllResults}
            on:toggle={() => (showAllResults = !showAllResults)} />
        {/if}
      </div>
    </Expander>
  </div>
</div>

<style src="./ResultRow.css"></style>
