<script lang="ts">
  import type { Observable } from 'rxjs';
  import type { IResource, Paragraph, Resource, Search } from '@nuclia/core';
  import { map, switchMap, tap } from 'rxjs/operators';
  import { nucliaState } from '../core/store';
  import { getResource } from '../core/api';
  import CloseButton from '../components/button/CloseButton.svelte';
  import ThumbnailPlayer from './ThumbnailPlayer.svelte';
  import Youtube from '../viewer/previewers/Youtube.svelte';
  import { getLinkField, getResourceParagraphs } from '../viewer/store';
  import { of } from 'rxjs';
  import { MediaWidgetParagraph } from '../core/models';
  import ParagraphPlayer from './ParagraphPlayer.svelte';
  import Icon from './Icon.svelte';
  import { fade } from 'svelte/transition';

  export let result: IResource = { id: '' };

  let innerWidth = window.innerWidth;

  let videoTileElement: HTMLElement;
  let videoTileHeight;
  let resource: Observable<Resource>;
  let expanded = false;
  let summary;
  let videoTime = 0;
  let youtubeUri: string | undefined;
  let paragraphInPlay: MediaWidgetParagraph | undefined;
  let findInTranscript = '';
  let transcripts: MediaWidgetParagraph[] = [];
  let showAllResults = false;
  let youtubeLoading = true;
  let showFullTranscripts = false;

  const matchingParagraphs = nucliaState()
    .getMatchingParagraphs(result.id)
    .pipe(
      map((results) =>
        results.map((paragraph) => ({
          ...paragraph,
          pid: `${paragraph.field_type}${(paragraph as Paragraph).start_seconds?.[0] || 0}${
            (paragraph as Paragraph).end_seconds?.[0] || 0
          }`,
          start: (paragraph as Paragraph).start_seconds?.[0] || 0,
          end: (paragraph as Paragraph).end_seconds?.[0] || 0,
        })),
      ),
    );

  const filterParagraphs = (paragraphs: MediaWidgetParagraph[]): MediaWidgetParagraph[] => {
    return paragraphs
      .filter((paragraph) => paragraph.text.toLocaleLowerCase().includes(findInTranscript.toLocaleLowerCase()))
      .map((paragraph) => {
        const regexp = new RegExp(findInTranscript, 'ig');
        return {
          ...paragraph,
          text: paragraph.text.replace(regexp, `<mark>$&</mark>`),
        };
      });
  };

  $: isMobile = innerWidth < 448;
  $: isExpandedFullScreen = innerWidth < 820;
  $: filteredMatchingParagraphs = !findInTranscript
    ? matchingParagraphs
    : matchingParagraphs.pipe(map((paragraphs) => filterParagraphs(paragraphs as MediaWidgetParagraph[])));
  $: filteredTranscripts = !findInTranscript ? transcripts : filterParagraphs(transcripts);

  const playFromStart = () => {
    playFrom(0);
  };

  const playParagraph = (paragraph) => {
    playFrom(paragraph.start, paragraph);
  };

  const playTranscript = (paragraph) => {
    videoTime = paragraph.start;
  };

  const playFrom = (time: number, selectedParagraph?: Search.Paragraph) => {
    videoTime = time;
    expanded = true;
    const paragraph$ = selectedParagraph
      ? of(selectedParagraph)
      : matchingParagraphs.pipe(map((paragraphList) => paragraphList[0]));
    if (!resource) {
      resource = paragraph$.pipe(
        tap((paragraph) => (paragraphInPlay = paragraph as MediaWidgetParagraph)),
        switchMap((paragraph) =>
          getResource(result.id).pipe(
            tap((res) => {
              const field = getLinkField(res, paragraph.field);
              youtubeUri = field?.value?.uri;
            }),
          ),
        ),
        tap((res) => {
          const summaries = res.summary ? [res.summary] : res.getExtractedSummaries();
          summary = summaries.filter((s) => !!s)[0];
          transcripts = getResourceParagraphs(res) as MediaWidgetParagraph[];
          setupExpandedTile();
        }),
      );
    }
  };

  const setupExpandedTile = () => {
    videoTileHeight = `${videoTileElement.offsetHeight}px`;
  }

  const onVideoReady = () => {
    youtubeLoading = false;
  };

  const closePreview = () => {
    expanded = false;
    youtubeLoading = true;
    findInTranscript = '';
  };

  const toggleTranscriptPanel = () => {
    showFullTranscripts = !showFullTranscripts;
  };
</script>

<svelte:window bind:innerWidth/>
<div class="sw-video-tile"
     class:expanded
     class:showAllResults
     bind:this={videoTileElement}
     style:--video-tile-height={videoTileHeight ? videoTileHeight : ''}>

  <div class="thumbnail-container">
    <div hidden={expanded && !youtubeLoading}
         transition:fade={{duration: 240}}>
      <ThumbnailPlayer thumbnail={result.thumbnail}
                       spinner={expanded && youtubeLoading}
                       aspectRatio={expanded ? '16/9' : '5/4'}
                       on:play={playFromStart}/>
    </div>

    {#if expanded}
      <div class="youtube-container"
           class:loading={youtubeLoading}>
        {#if youtubeUri}
          <Youtube time={videoTime} uri={youtubeUri} on:videoReady={onVideoReady} />
        {/if}
      </div>
    {/if}

    {#if $resource}
      <div class="summary-container"
           hidden="{!expanded}"
           transition:fade={{duration: 160}}>
        <div class="summary">{summary}</div>
      </div>
    {/if}
  </div>

  <div class="result-details">
    <header>
      <h3 class="ellipsis">{result?.title}</h3>
      {#if expanded}
        <div in:fade={{duration: 240}}>
          <CloseButton aspect="basic"
                       on:click={closePreview}/>
        </div>
      {/if}
    </header>

    <div class:side-panel={expanded}>
      <div class="find-bar-container" hidden="{!expanded}">
        <Icon name="search" />
        <input
          class="find-input"
          type="text"
          autocomplete="off"
          aria-label="Find a transcript"
          placeholder="Find a transcript"
          bind:value={findInTranscript}
        />
      </div>
      <div class="search-result-paragraphs"
           class:transcript-container={expanded}>
        {#if findInTranscript && $filteredMatchingParagraphs.length === 0}
          <strong>{findInTranscript}</strong> not found in your search results…
        {/if}
        <ul class="paragraphs-container"
            class:expanded={showAllResults}
            class:can-expand={$matchingParagraphs.length > 4}
            style="--paragraph-count: {$matchingParagraphs.length}">
          {#each $filteredMatchingParagraphs as paragraph}
            <ParagraphPlayer {paragraph}
                             ellipsis={!expanded}
                             minimized={isMobile && !expanded}
                             stack={expanded}
                             on:play={(event) => playParagraph(event.detail.paragraph)}/>
          {/each}
        </ul>
      </div>
      <div hidden="{!expanded}"
           tabindex="0"
           class="transcript-expander-header"
           class:expanded={showFullTranscripts}
           on:click={toggleTranscriptPanel}
           on:keyup={(e) => {
             if (e.key === 'Enter') toggleTranscriptPanel();
           }}>
        <div tabindex="-1" class="transcript-expander-header-title">
          <strong>Full transcript</strong>
        </div>
        <div tabindex="-1" class="transcript-expander-header-chevron">
          <Icon name="chevron-right" />
        </div>
      </div>
      {#if showFullTranscripts}
        <div class="transcript-container">
          <ul class="paragraphs-container">
            {#each filteredTranscripts as paragraph}
              <ParagraphPlayer
                {paragraph}
                selected={paragraph === paragraphInPlay}
                stack
                on:play={(event) => playTranscript(event.detail.paragraph)}
              />
            {/each}
          </ul>
        </div>
      {/if}
    </div>

    {#if !expanded && $matchingParagraphs.length > 4}
      <div class="all-result-toggle"
           class:expanded={showAllResults}
           on:click={() => (showAllResults = !showAllResults)}>
        Display {showAllResults ? 'less' : 'all'} results

        <div class="icon">
          <Icon name="chevron-right" size="small"/>
        </div>
      </div>
    {/if}
  </div>
</div>

<style lang="scss" src="./VideoTile.scss"></style>
