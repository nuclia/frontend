<script lang="ts">
  import { Observable, Subject } from 'rxjs';
  import type { Resource, Search } from '@nuclia/core';
  import { switchMap, take, tap } from 'rxjs/operators';
  import { getFileUrl, getResource } from '../../core/api';
  import IconButton from '../../common/button/IconButton.svelte';
  import ThumbnailPlayer from '../../common/thumbnail/ThumbnailPlayer.svelte';
  import Youtube from '../../old-components/viewer/previewers/Youtube.svelte';
  import { FieldType, MediaWidgetParagraph, PreviewKind } from '../../core/models';
  import Icon from '../../common/icons/Icon.svelte';
  import { fade, slide } from 'svelte/transition';
  import Player from '../../old-components/viewer/previewers/Player.svelte';
  import { Duration } from '../../common/transition.utils';
  import ParagraphResult from '../../common/paragraph-result/ParagraphResult.svelte';
  import AllResultsToggle from '../../common/paragraph-result/AllResultsToggle.svelte';
  import { _ } from '../../core/i18n';
  import { freezeBackground, unblockBackground } from '../../common/modal/modal.utils';
  import {
    getExternalUrl,
    getFileField,
    getLinkField,
    getMediaTranscripts,
    getVideoStream,
    goToUrl,
    isYoutubeUrl,
    mapSmartParagraph2WidgetParagraph,
  } from '../../core/utils';
  import { filterParagraphs, isFileOrLink } from '../tile.utils';
  import DocTypeIndicator from '../../common/indicators/DocTypeIndicator.svelte';
  import { navigateToLink } from '../../core/stores/widget.store';

  export let result: Search.SmartResult = { id: '' } as Search.SmartResult;

  let innerWidth = window.innerWidth;
  let mediaTileElement: HTMLElement;
  let mediaTileHeight;
  let resource: Observable<Resource>;
  let expanded = false;
  let summary;
  let mediaLoading = true;
  let mediaTime = 0;
  let youtubeUri: string | undefined;
  let mediaContentType: string | undefined;
  let paragraphInPlay: MediaWidgetParagraph | undefined;
  let findInTranscript = '';
  let transcripts: MediaWidgetParagraph[] = [];
  let showAllResults = false;
  let thumbnailLoaded = false;
  let showFullTranscripts = false;
  let animatingShowFullTranscript = false;

  const _mediaUri = new Subject<string | undefined>();
  const mediaUri = _mediaUri.pipe(switchMap((uri) => getFileUrl(uri)));

  const matchingParagraphs: MediaWidgetParagraph[] = (result.paragraphs?.map((paragraph) =>
    mapSmartParagraph2WidgetParagraph(paragraph, PreviewKind.VIDEO),
  ) || []) as MediaWidgetParagraph[];

  $: isMobile = innerWidth < 448;
  $: defaultTransitionDuration = expanded ? Duration.MODERATE : 0;
  $: filteredMatchingParagraphs = !findInTranscript
    ? matchingParagraphs
    : filterParagraphs(findInTranscript, matchingParagraphs || []);
  $: filteredTranscripts = !findInTranscript ? transcripts : filterParagraphs(findInTranscript, transcripts);

  const playFromStart = () => {
    playFrom(0);
  };

  const onClickParagraph = (paragraph: MediaWidgetParagraph) => {
    navigateToLink.pipe(take(1)).subscribe((navigateToLink) => {
      const url = getExternalUrl(result);
      if (navigateToLink && url && !isYoutubeUrl(url)) {
        goToUrl(url, paragraph.text);
      } else {
        playParagraph(paragraph);
      }
    });
  };

  const playParagraph = (paragraph: MediaWidgetParagraph) => {
    playFrom(paragraph.start_seconds, paragraph);
    paragraphInPlay = paragraph;
  };

  const playTranscript = (paragraph) => {
    mediaTime = paragraph.start_seconds || 0;
    paragraphInPlay = paragraph;
  };

  const playFrom = (time: number, selectedParagraph?: MediaWidgetParagraph) => {
    mediaTime = time;
    if (!expanded) {
      expanded = true;
      freezeBackground(true);
    }

    const paragraph =
      selectedParagraph && isFileOrLink(selectedParagraph.fieldType)
        ? selectedParagraph
        : matchingParagraphs.filter((p) => isFileOrLink(p.fieldType))[0] || matchingParagraphs[0];
    if (!resource) {
      resource = getResource(result.id).pipe(
        tap((res) => {
          if (paragraph.fieldType === FieldType.LINK) {
            const linkField = getLinkField(res, paragraph.fieldId);
            youtubeUri = linkField?.value?.uri;
          } else if (paragraph.fieldType === FieldType.FILE) {
            const fileField = getFileField(res, res.id);
            const file = fileField && (getVideoStream(fileField) || fileField.value?.file);
            if (file) {
              mediaContentType = file.content_type;
              _mediaUri.next(file.uri);
            }
          }
          const summaries = res.summary ? [res.summary] : res.getExtractedSummaries();
          summary = summaries.filter((s) => !!s)[0];
          transcripts = getMediaTranscripts(res, PreviewKind.VIDEO);
          setupExpandedTile();
        }),
      );
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
        on:open={playFromStart} />
    </div>

    {#if expanded}
      <div
        class="media-container"
        class:loading={mediaLoading}>
        {#if youtubeUri}
          <Youtube
            time={mediaTime}
            uri={youtubeUri}
            on:videoReady={onVideoReady} />
        {/if}
        {#if $mediaUri}
          <Player
            time={mediaTime}
            src={$mediaUri}
            type={mediaContentType}
            on:videoReady={onVideoReady} />
        {/if}
      </div>
    {/if}

    {#if $resource}
      <div
        class="summary-container"
        hidden={!expanded}
        transition:fade={{ duration: Duration.SUPERFAST }}>
        <div class="summary">{summary}</div>
      </div>
    {/if}
  </div>

  {#if thumbnailLoaded}
    <div
      class="result-details"
      transition:fade={{ duration: Duration.SUPERFAST }}>
      <header>
        <div class:header-title={expanded}>
          <div class="doc-type-container">
            <DocTypeIndicator type="video" />
          </div>
          <h3
            class="ellipsis"
            on:click={playFromStart}>
            {result?.title}
          </h3>
        </div>
        {#if expanded}
          <div in:fade={{ duration: Duration.FAST }}>
            <IconButton
              icon="cross"
              ariaLabel={$_('generic.close')}
              aspect="basic"
              on:click={closePreview} />
          </div>
        {/if}
      </header>

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
              transition:slide={{ duration: defaultTransitionDuration }}
              on:introstart={() => (animatingShowFullTranscript = true)}
              on:introend={() => (animatingShowFullTranscript = false)}
              on:outrostart={() => (animatingShowFullTranscript = true)}
              on:outroend={() => (animatingShowFullTranscript = false)}
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
              transition:slide={{ duration: defaultTransitionDuration }}
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
            <div
              class="transcript-container scrollable-area"
              in:slide={{ duration: defaultTransitionDuration, delay: defaultTransitionDuration }}
              out:slide={{ duration: defaultTransitionDuration }}>
              <ul class="paragraphs-container">
                {#each filteredTranscripts as paragraph}
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
