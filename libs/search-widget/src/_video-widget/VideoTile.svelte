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
  import Spinner from '../components/spinner/Spinner.svelte';

  export let result: IResource = { id: '' };

  let innerWidth = window.innerWidth;

  let tileElement: HTMLElement;
  let expandedHeaderElement: HTMLElement;
  let sidePanelElement: HTMLElement;
  let resource: Observable<Resource>;
  let expanded = false;
  let summaries = [];
  let videoTime = 0;
  let youtubeUri: string | undefined;
  let paragraphInPlay: MediaWidgetParagraph | undefined;
  let findInTranscript = '';
  let transcripts: MediaWidgetParagraph[] = [];
  let showAllResults = false;
  let youtubeLoading = true;
  let showFullTranscripts = false;
  let expandedHeight;
  let sidePanelHeight;

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

  $: isMobile = innerWidth < 600;
  $: isExpandedFullScreen = innerWidth < 1024;
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
          const _summaries = res.summary
            ? [res.summary].concat(res.getExtractedSummaries())
            : res.getExtractedSummaries();
          summaries = _summaries.filter((s) => !!s);
          transcripts = getResourceParagraphs(res) as MediaWidgetParagraph[];
        }),
      );
    }
  };

  const initExpandedStyle = () => {
    const expandedRect = tileElement.getBoundingClientRect();
    expandedHeight = `${expandedRect.height}px`;
    youtubeLoading = false;

    if (!isExpandedFullScreen) {
      tileElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    setTimeout(() => {
      if (isExpandedFullScreen) {
        const padding = isMobile ? 32 : 16;
        sidePanelHeight = `calc(100vh - ${sidePanelElement?.getBoundingClientRect().top + padding}px)`;
      } else {
        sidePanelHeight = `calc(${expandedHeight} - ${expandedHeaderElement?.getBoundingClientRect().height}px)`;
      }
    }, 100);
  };

  const closePreview = () => {
    expanded = false;
    youtubeLoading = true;
  };

  const toggleTranscriptPanel = () => {
    showFullTranscripts = !showFullTranscripts;
  };
</script>

<svelte:window bind:innerWidth />
<div
  class="sw-video-tile"
  class:expanded
  class:showAllResults
  bind:this={tileElement}
  style:max-height={expandedHeight}
>
  {#if expanded}
    <header bind:this={expandedHeaderElement}>
      <h3>{result?.title}</h3>
      <CloseButton aspect="basic" on:click={closePreview} />
    </header>
    <div class="expanded-tile-content" class:full-transcript-expanded={showFullTranscripts}>
      <div class="video-and-summary-container">
        <div class="youtube-container" class:loading={youtubeLoading}>
          {#if youtubeLoading}
            <Spinner />
          {/if}
          {#if youtubeUri}
            <Youtube time={videoTime} uri={youtubeUri} on:videoReady={initExpandedStyle} />
          {/if}
        </div>
        <div class="summary-container">
          {#each summaries as summary}
            <div class="summary">{summary}</div>
          {/each}
        </div>
      </div>

      {#if $resource}
        <div
          class="side-panel"
          style:height={sidePanelHeight}
          style:max-height={youtubeLoading ? '365px' : sidePanelHeight}
          bind:this={sidePanelElement}
        >
          <div class="find-bar-container">
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
          <div class="transcript-container">
            {#if findInTranscript && $filteredMatchingParagraphs.length === 0}
              <strong>{findInTranscript}</strong> not found in your search results…
            {/if}
            <ul class="paragraphs-container">
              {#each $filteredMatchingParagraphs as paragraph}
                <ParagraphPlayer
                  {paragraph}
                  selected={paragraph.pid === paragraphInPlay.pid}
                  stack
                  on:play={(event) => playTranscript(event.detail.paragraph)}
                />
              {/each}
            </ul>
          </div>
          <div
            tabindex="0"
            class="transcript-expander-header"
            class:expanded={showFullTranscripts}
            on:click={toggleTranscriptPanel}
            on:keyup={(e) => {
              if (e.key === 'Enter') toggleTranscriptPanel();
            }}
          >
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
      {/if}
    </div>
  {:else}
    <div class="thumbnail-container">
      <ThumbnailPlayer thumbnail={result.thumbnail} on:play={playFromStart} />
    </div>

    <div class="result-details">
      <h3 class="ellipsis">{result?.title}</h3>
      <ul
        class="paragraphs-container"
        class:expanded={showAllResults}
        style="--paragraph-count: {$matchingParagraphs.length}"
      >
        {#each $matchingParagraphs as paragraph}
          <ParagraphPlayer
            {paragraph}
            ellipsis
            minimized={isMobile}
            on:play={(event) => playParagraph(event.detail.paragraph)}
          />
        {/each}
      </ul>
      {#if $matchingParagraphs.length > 4}
        <div
          class="all-result-toggle"
          class:expanded={showAllResults}
          on:click={() => (showAllResults = !showAllResults)}
        >
          Display {showAllResults ? 'less' : 'all'} results

          <div class="icon">
            <Icon name="chevron-right" size="small" />
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
