<script lang="ts">
  import { Search } from '@nuclia/core';
  import { Duration } from '../../common/transition.utils';
  import { MediaWidgetParagraph, PreviewKind } from '../../core/models';
  import { getCDN, getExternalUrl, goToUrl, mapSmartParagraph2WidgetParagraph } from '../../core/utils';
  import ThumbnailPlayer from '../../common/thumbnail/ThumbnailPlayer.svelte';
  import { freezeBackground, unblockBackground } from '../../common/modal/modal.utils';
  import { take } from 'rxjs/operators';
  import { filterParagraphs } from '../tile.utils';
  import { map, Observable } from 'rxjs';
  import { _ } from '../../core/i18n';
  import Icon from '../../common/icons/Icon.svelte';
  import ParagraphResult from '../../common/paragraph-result/ParagraphResult.svelte';
  import AllResultsToggle from '../../common/paragraph-result/AllResultsToggle.svelte';
  import { AudioPlayer } from '../../common/player';
  import { navigateToLink } from '../../core/stores/widget.store';
  import { onMount } from 'svelte';
  import { displayedResource } from '../../core/stores/search.store';
  import TileHeader from '../base-tile/TileHeader.svelte';
  import {
    fieldData,
    fieldFullId,
    getFieldSummary,
    getFieldUrl,
    getMediaTranscripts,
    resourceTitle,
    viewerState,
  } from '../../core/stores/viewer.store';
  import { getResourceField } from '../../core/api';

  export let result: Search.SmartResult;

  let innerWidth = window.innerWidth;
  let mediaTileElement: HTMLElement;
  let mediaTileHeight;
  let expanded = false;
  let mediaLoading = true;
  let mediaTime = 0;
  let paragraphInPlay: MediaWidgetParagraph | undefined;
  let findInTranscript = '';
  let showAllResults = false;
  let thumbnailLoaded = false;
  let showFullTranscripts = false;
  let animatingShowFullTranscript = false;

  let mediaUrl: Observable<string>;
  let summary: Observable<string>;
  let transcripts: Observable<MediaWidgetParagraph[]>;

  const matchingParagraphs: MediaWidgetParagraph[] =
    result.paragraphs?.map(
      (paragraph) => mapSmartParagraph2WidgetParagraph(paragraph, PreviewKind.AUDIO) as MediaWidgetParagraph,
    ) || [];

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
      if (navigateToLink && url) {
        goToUrl(url, paragraph?.text);
      } else {
        paragraph ? playParagraph(paragraph) : playFromStart();
      }
    });
  };

  const playParagraph = (paragraph: MediaWidgetParagraph) => {
    playFrom(paragraph.start_seconds || 0);
    paragraphInPlay = paragraph;
  };

  const playTranscript = (paragraph) => {
    playFrom(paragraph.start_seconds || 0);
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

      getResourceField(fullId).subscribe((field) => {
        fieldData.set(field);
        summary = getFieldSummary();
        transcripts = getMediaTranscripts(PreviewKind.AUDIO);
        setTimeout(() => setupExpandedTile(), 0);
      });
    }
  };

  const setupExpandedTile = () => {
    mediaTileHeight = `${mediaTileElement.offsetHeight}px`;
  };

  const closePreview = () => {
    expanded = false;
    mediaLoading = true;
    showFullTranscripts = false;
    paragraphInPlay = undefined;
    findInTranscript = '';
    viewerState.reset();
    unblockBackground(true);
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
  class="sw-tile sw-audio-tile"
  class:expanded
  class:showFullTranscripts
  bind:this={mediaTileElement}
  style:--media-tile-height={mediaTileHeight ? mediaTileHeight : ''}>
  <div class="thumbnail-container">
    <div hidden={expanded && !mediaLoading}>
      <ThumbnailPlayer
        thumbnail={result.thumbnail}
        fallback={`${getCDN()}tiles/audio.svg`}
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
          <AudioPlayer
            time={mediaTime}
            src={$mediaUrl}
            on:audioReady={() => (mediaLoading = false)}
            on:error={() => (mediaLoading = false)} />
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
        typeIndicator="audio"
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
  src="./AudioTile.scss"></style>
