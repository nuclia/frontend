<script lang="ts">
  import { Resource, Search } from '@nuclia/core';
  import { Duration } from '../../common/transition.utils';
  import { FieldType, MediaWidgetParagraph, PreviewKind } from '../../core/models';
  import { getCDN, mapSmartParagraph2WidgetParagraph } from '../../core/utils';
  import ThumbnailPlayer from '../../common/thumbnail/ThumbnailPlayer.svelte';
  import { freezeBackground, unblockBackground } from '../../common/modal/modal.utils';
  import { getRegionalBackend, getResource } from '../../core/api';
  import { tap } from 'rxjs/operators';
  import { getFileField, getMainFieldParagraphs, getVideoStream } from '../../core/old-stores/viewer.store';
  import { filterParagraphs, isFile } from '../tile.utils';
  import { Observable } from 'rxjs';
  import Player from '../../old-components/viewer/previewers/Player.svelte';
  import { fade, slide } from 'svelte/transition';
  import { IconButton } from '../../common';
  import { _ } from '../../core/i18n';
  import Icon from '../../common/icons/Icon.svelte';
  import ParagraphResult from '../../common/paragraph-result/ParagraphResult.svelte';
  import AllResultsToggle from '../../common/paragraph-result/AllResultsToggle.svelte';
  import DocTypeIndicator from '../../common/indicators/DocTypeIndicator.svelte';
  import { AudioPlayer } from '../../common/player';

  export let result: Search.SmartResult = { id: '' } as Search.SmartResult;

  let innerWidth = window.innerWidth;
  let mediaTileElement: HTMLElement;
  let mediaTileHeight;
  let resource: Observable<Resource>;
  let expanded = false;
  let summary;
  let mediaLoading = true;
  let mediaTime = 0;
  let mediaUri: string | undefined;
  let mediaContentType: string | undefined;
  let paragraphInPlay: MediaWidgetParagraph | undefined;
  let findInTranscript = '';
  let transcripts: MediaWidgetParagraph[] = [];
  let showAllResults = false;
  let thumbnailLoaded = false;
  let showFullTranscripts = false;
  let animatingShowFullTranscript = false;

  const matchingParagraphs: MediaWidgetParagraph[] =
    result.paragraphs?.map(
      (paragraph) => mapSmartParagraph2WidgetParagraph(paragraph, PreviewKind.AUDIO) as MediaWidgetParagraph,
    ) || [];

  $: isMobile = innerWidth < 448;
  $: defaultTransitionDuration = expanded ? Duration.MODERATE : 0;
  $: filteredMatchingParagraphs = !findInTranscript
    ? matchingParagraphs
    : filterParagraphs(findInTranscript, matchingParagraphs || []);
  $: filteredTranscripts = !findInTranscript ? transcripts : filterParagraphs(findInTranscript, transcripts);

  const playFromStart = () => {
    playFrom(0);
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
      selectedParagraph && isFile(selectedParagraph.fieldType)
        ? selectedParagraph
        : matchingParagraphs.filter((p) => isFile(p.fieldType))[0] || matchingParagraphs[0];
    if (!resource) {
      resource = getResource(result.id).pipe(
        tap((res) => {
          if (paragraph.fieldType === FieldType.FILE) {
            const fileField = getFileField(res, res.id);
            const file = fileField && fileField.value?.file;
            if (file) {
              mediaContentType = file.content_type;
              mediaUri = `${getRegionalBackend()}${file.uri}`;
            }
          }
          const summaries = res.summary ? [res.summary] : res.getExtractedSummaries();
          summary = summaries.filter((s) => !!s)[0];
          transcripts = getMainFieldParagraphs(res) as MediaWidgetParagraph[];
          setupExpandedTile();
        }),
      );
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
    unblockBackground(true);
  };

  const toggleTranscriptPanel = () => {
    showFullTranscripts = !showFullTranscripts;
  };
</script>

<svelte:window bind:innerWidth />
<div
  class="sw-tile sw-audio-tile"
  class:expanded
  class:showFullTranscripts
  bind:this={mediaTileElement}>
  <div class="thumbnail-container">
    <div hidden={expanded && !mediaLoading}>
      <ThumbnailPlayer
        thumbnail={result.thumbnail}
        fallback={`${getCDN()}tiles/audio.svg`}
        spinner={expanded && mediaLoading}
        hasBackground={!result.thumbnail}
        aspectRatio={expanded ? '16/9' : '5/4'}
        on:loaded={() => (thumbnailLoaded = true)}
        on:open={playFromStart} />
    </div>

    {#if expanded}
      <div
        class="player-container"
        class:loading={mediaLoading}>
        {#if mediaUri}
          <AudioPlayer
            time={mediaTime}
            src={mediaUri} />
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
            <DocTypeIndicator type="audio" />
          </div>
          <h3 class="ellipsis">{result?.title}</h3>
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
                  on:open={(event) => playParagraph(event.detail.paragraph)} />
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
  src="./AudioTile.scss"></style>
