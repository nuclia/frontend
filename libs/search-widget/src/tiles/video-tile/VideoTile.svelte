<script lang="ts">
  import { onMount } from 'svelte';
  import { map, Observable, tap } from 'rxjs';
  import type { Search } from '@nuclia/core';
  import { switchMap, take } from 'rxjs/operators';
  import { getResourceField } from '../../core/api';
  import ThumbnailPlayer from '../../common/thumbnail/ThumbnailPlayer.svelte';
  import Youtube from '../../old-components/viewer/previewers/Youtube.svelte';
  import { MediaWidgetParagraph, PreviewKind } from '../../core/models';
  import Icon from '../../common/icons/Icon.svelte';
  import Player from '../../old-components/viewer/previewers/Player.svelte';
  import { Duration } from '../../common/transition.utils';
  import ParagraphResult from '../../common/paragraph-result/ParagraphResult.svelte';
  import AllResultsToggle from '../../common/paragraph-result/AllResultsToggle.svelte';
  import { _ } from '../../core/i18n';
  import { freezeBackground, unblockBackground } from '../../common/modal/modal.utils';
  import { getExternalUrl, goToUrl, isYoutubeUrl, mapSmartParagraph2WidgetParagraph } from '../../core/utils';
  import { filterParagraphs } from '../tile.utils';
  import { navigateToLink } from '../../core/stores/widget.store';
  import { displayedResource } from '../../core/stores/search.store';
  import TileHeader from '../base-tile/TileHeader.svelte';
  import {
    fieldData,
    fieldFullId,
    getFieldSummary,
    getFieldUrl,
    getFileFieldContentType,
    getMediaTranscripts,
    isLinkField,
    resourceTitle,
  } from '../../core/stores/viewer.store';

  export let result: Search.SmartResult = { id: '' } as Search.SmartResult;

  let innerWidth = window.innerWidth;
  let mediaTileElement: HTMLElement;
  let mediaTileHeight;
  let expanded = false;
  let mediaLoading = true;
  let mediaTime = 0;
  let mediaContentType: string | undefined;
  let paragraphInPlay: MediaWidgetParagraph | undefined;
  let findInTranscript = '';
  let showAllResults = false;
  let thumbnailLoaded = false;
  let showFullTranscripts = false;
  let animatingShowFullTranscript = false;

  let mediaUrl: Observable<string>;
  let summary: Observable<string>;
  let transcripts: Observable<MediaWidgetParagraph[]>;
  let isYoutube = false;

  const matchingParagraphs: MediaWidgetParagraph[] = (result.paragraphs?.map((paragraph) =>
    mapSmartParagraph2WidgetParagraph(paragraph, PreviewKind.VIDEO),
  ) || []) as MediaWidgetParagraph[];

  $: isMobile = innerWidth < 448;
  $: defaultTransitionDuration = expanded ? Duration.MODERATE : 0;
  $: filteredMatchingParagraphs = !findInTranscript
    ? matchingParagraphs
    : filterParagraphs(findInTranscript, matchingParagraphs || []);
  $: filteredTranscripts = !findInTranscript
    ? transcripts
    : transcripts.pipe(map((paragraphs) => filterParagraphs(findInTranscript, paragraphs)));

  onMount(() => {
    if (displayedResource.getValue()?.uid === result.id) {
      playFromStart();
    }
  });

  const playFromStart = () => {
    playFrom(0);
  };

  const onClickParagraph = (paragraph?: MediaWidgetParagraph) => {
    navigateToLink.pipe(take(1)).subscribe((navigateToLink) => {
      const url = getExternalUrl(result);
      if (navigateToLink && url && !isYoutubeUrl(url)) {
        goToUrl(url, paragraph?.text);
      } else {
        paragraph ? playParagraph(paragraph) : playFromStart();
      }
    });
  };

  const playParagraph = (paragraph: MediaWidgetParagraph) => {
    playFrom(paragraph.start_seconds);
    paragraphInPlay = paragraph;
  };

  const playTranscript = (paragraph) => {
    mediaTime = paragraph.start_seconds || 0;
    paragraphInPlay = paragraph;
  };

  const playFrom = (time: number) => {
    mediaTime = time;
    if (!expanded) {
      expanded = true;
      freezeBackground(true);
    }

    if (!mediaUrl && result.field) {
      const fullId = {
        ...result.field,
        resourceId: result.id,
      };
      fieldFullId.set(fullId);
      fieldData.set(result.fieldData || null);
      resourceTitle.set(result.title || '');

      mediaUrl = getFieldUrl();

      getResourceField(fullId)
        .pipe(
          tap((field) => {
            fieldData.set(field);
            summary = getFieldSummary();
            transcripts = getMediaTranscripts(PreviewKind.VIDEO);
            setTimeout(() => setupExpandedTile(), 0);
          }),
          switchMap(() => isLinkField()),
          tap((isLink: boolean) => (isYoutube = isLink)),
          switchMap(() => getFileFieldContentType()),
        )
        .subscribe((contentType) => {
          mediaContentType = contentType;
          console.log(contentType);
        });
    }
  };

  const setupExpandedTile = () => {
    mediaTileHeight = `${mediaTileElement.offsetHeight}px`;
  };

  const onVideoReady = () => {
    mediaLoading = false;
  };

  const closePreview = () => {
    expanded = false;
    mediaLoading = true;
    showFullTranscripts = false;
    paragraphInPlay = undefined;
    findInTranscript = '';
    unblockBackground(true);
    if (displayedResource.getValue()?.uid === result.id) {
      displayedResource.set(null);
    }
  };

  const toggleTranscriptPanel = () => {
    showFullTranscripts = !showFullTranscripts;
  };

  const handleKeydown = (event) => {
    if (event.key === 'Escape') {
      closePreview();
    }
  };
</script>

<svelte:window
  bind:innerWidth
  on:keydown={handleKeydown} />
<div
  class="sw-tile sw-video-tile"
  class:expanded
  class:showFullTranscripts
  bind:this={mediaTileElement}
  style:--media-tile-height={mediaTileHeight ? mediaTileHeight : ''}>
  <div class="thumbnail-container">
    <div hidden={expanded && !mediaLoading}>
      <ThumbnailPlayer
        thumbnail={result.thumbnail}
        spinner={expanded && mediaLoading}
        hasBackground={!result.thumbnail}
        aspectRatio={expanded ? '16/9' : '5/4'}
        on:loaded={() => (thumbnailLoaded = true)}
        on:play={playFromStart} />
    </div>

    {#if expanded}
      <div
        class="media-container"
        class:loading={mediaLoading}>
        {#if $mediaUrl}
          {#if isYoutube}
            <Youtube
              time={mediaTime}
              uri={$mediaUrl}
              on:videoReady={onVideoReady} />
          {:else if !!mediaContentType}
            <Player
              time={mediaTime}
              src={$mediaUrl}
              type={mediaContentType}
              on:videoReady={onVideoReady} />
          {/if}
        {/if}
      </div>
    {/if}

    {#if $summary}
      <div
        class="summary-container"
        hidden={!expanded}>
        <div class="summary">{$summary}</div>
      </div>
    {/if}
  </div>

  {#if thumbnailLoaded}
    <div class="result-details">
      <TileHeader
        {expanded}
        resourceTitle={result.title}
        typeIndicator="video"
        on:clickOnTitle={onClickParagraph}
        on:close={closePreview} />

      <div class:side-panel={expanded}>
        <div
          class="find-bar-container"
          tabindex="0"
          hidden={!expanded}>
          <Icon name="search" />
          <input
            class="find-input"
            type="text"
            autocomplete="off"
            aria-label={$_('tile.find-transcript')}
            placeholder={$_('tile.find-transcript')}
            tabindex="-1"
            bind:value={findInTranscript} />
        </div>

        <div
          class="search-result-paragraphs"
          tabindex="-1"
          class:on-animation={animatingShowFullTranscript}
          class:transcript-container={expanded}>
          {#if !showFullTranscripts && findInTranscript && filteredMatchingParagraphs.length === 0}
            <strong>{findInTranscript}</strong>
            not found in your search results…
          {/if}
          {#if showFullTranscripts}
            <div
              tabindex="0"
              class="transcript-expander-header"
              on:click={toggleTranscriptPanel}
              on:keyup={(e) => {
                if (e.key === 'Enter') toggleTranscriptPanel();
              }}>
              <div
                tabindex="-1"
                class="transcript-expander-header-title">
                <strong>{matchingParagraphs.length} search results</strong>
              </div>
              <div
                tabindex="-1"
                class="transcript-expander-header-chevron">
                <Icon name="chevron-right" />
              </div>
            </div>
          {/if}

          {#if !expanded || !showFullTranscripts}
            <ul
              class="paragraphs-container"
              class:expanded={showAllResults}
              class:can-expand={matchingParagraphs.length > 4}
              style="--paragraph-count: {matchingParagraphs.length}">
              {#each filteredMatchingParagraphs as paragraph}
                <ParagraphResult
                  {paragraph}
                  ellipsis={!expanded}
                  minimized={isMobile && !expanded}
                  stack={expanded}
                  selected={paragraph === paragraphInPlay}
                  on:open={(event) => onClickParagraph(event.detail.paragraph)} />
              {/each}
            </ul>
          {/if}
        </div>

        <div
          class="full-transcript-container"
          class:on-animation={animatingShowFullTranscript}>
          <div
            hidden={!expanded}
            tabindex="0"
            class="transcript-expander-header"
            class:expanded={showFullTranscripts}
            on:click={toggleTranscriptPanel}
            on:keyup={(e) => {
              if (e.key === 'Enter') toggleTranscriptPanel();
            }}>
            <div
              tabindex="-1"
              class="transcript-expander-header-title">
              <strong>Full transcript</strong>
            </div>
            <div
              tabindex="-1"
              class="transcript-expander-header-chevron">
              <Icon name="chevron-right" />
            </div>
          </div>
          {#if showFullTranscripts}
            <div class="transcript-container scrollable-area">
              <ul class="paragraphs-container">
                {#each $filteredTranscripts as paragraph}
                  <ParagraphResult
                    {paragraph}
                    selected={paragraph === paragraphInPlay}
                    stack
                    on:open={(event) => playTranscript(event.detail.paragraph)} />
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      </div>

      {#if !expanded && matchingParagraphs.length > 4}
        <AllResultsToggle
          {showAllResults}
          on:toggle={() => (showAllResults = !showAllResults)} />
      {/if}
    </div>
  {/if}
</div>

<style
  lang="scss"
  src="./VideoTile.scss"></style>
