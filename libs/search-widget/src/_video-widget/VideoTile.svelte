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

  export let result: IResource = {id: ''};

  let resource: Observable<Resource>;
  let expanded = false;
  let summaries = [];
  let videoTime = 0;
  let youtubeUri: string | undefined;
  let paragraphInPlay: MediaWidgetParagraph | undefined;
  let findInTranscript = '';
  let transcripts: MediaWidgetParagraph[] = [];
  let showAllResults = false;
  let showSidePanel = false;
  let showFullTranscripts = false;
  let tileElement: HTMLElement;
  let expandedHeight;

  /*
  map((results) => {
        console.log(results);
        return {
          ...results,
          paragraphs: {
            ...results.paragraphs,
            results: (results.paragraphs?.results || []).map((p) => ({
              ...p,
              pid: `${p.field_type}${p.start_seconds?.[0] || 0}`,
            })),
          },
        };
      }),
   */
  const matchingParagraphs = nucliaState().getMatchingParagraphs(result.id).pipe(
    map(results => results.map(paragraph => ({
      ...paragraph,
      pid: `${paragraph.field_type}${(paragraph as Paragraph).start_seconds?.[0] || 0}${(paragraph as Paragraph).end_seconds?.[0] || 0}`,
      time: (paragraph as Paragraph).start_seconds?.[0] || 0,
    })))
  );

  const filterParagraphs = (paragraphs: MediaWidgetParagraph[]): MediaWidgetParagraph[] => {
    return paragraphs
      .filter(paragraph => paragraph.text.toLocaleLowerCase().includes(findInTranscript.toLocaleLowerCase()))
      .map(paragraph => {
        const regexp = new RegExp(findInTranscript, 'ig');
        return {
          ...paragraph,
          text: paragraph.text.replace(regexp, `<mark>$&</mark>`),
        }
      });
  }

  $: filteredMatchingParagraphs = !findInTranscript ? matchingParagraphs : matchingParagraphs.pipe(
    map(paragraphs => filterParagraphs(paragraphs as MediaWidgetParagraph[])),
  );
  $: filteredTranscripts = !findInTranscript ? transcripts : filterParagraphs(transcripts);

  $: displayedResultCount = showAllResults ? -1 : 4;

  const playFromStart = () => {
    playFrom(0);
  };

  const playParagraph = (paragraph) => {
    playFrom(paragraph.time, paragraph);
    paragraphInPlay = paragraph;
  };

  const playTranscript = (paragraph) => {
    videoTime = paragraph.time;
    paragraphInPlay = paragraph;
  };

  const playFrom = (time: number, selectedParagraph?: Search.Paragraph) => {
    videoTime = time;
    expanded = true;
    const paragraph$ = selectedParagraph ? of(selectedParagraph) : matchingParagraphs.pipe(map(paragraphList => paragraphList[0]));
    if (!resource) {
      resource = paragraph$.pipe(
        switchMap(paragraph => getResource(result.id).pipe(tap(res => {
          const field = getLinkField(res, paragraph.field);
          youtubeUri = field?.value?.uri;
        }))),
        tap(res => {
          const _summaries = res.summary ? [res.summary].concat(res.getExtractedSummaries()) : res.getExtractedSummaries();
          summaries = _summaries.filter((s) => !!s);
          transcripts = getResourceParagraphs(res) as MediaWidgetParagraph[];
        }),
      );
    }
  };

  const initExpandedStyle = () => {
      const expandedRect = tileElement.getBoundingClientRect();
      expandedHeight = `${expandedRect.height}px`;
      showSidePanel = true;
  }

  const closePreview = () => {
    expanded = false;
  };

  const toggleTranscriptPanel = () => {
    showFullTranscripts = !showFullTranscripts;
  };
</script>


<div class="video-tile"
     class:expanded
     class:showAllResults
     bind:this={tileElement}
     style:max-height="{expandedHeight}"
>
  {#if expanded}
    <header>
      <h3 class="ellipsis">{result?.title}</h3>
      <CloseButton aspect="basic"
                   on:click={closePreview}/>
    </header>
    <div class="expanded-tile-content"
         class:full-transcript-expanded={showFullTranscripts}>
      {#if $resource}
        <div class="video-and-summary-container">
          {#if youtubeUri}
            <Youtube time={videoTime}
                     uri={youtubeUri}
                     on:videoReady={initExpandedStyle}/>
          {/if}
          <div class="summary-container">
            {#each summaries as summary}
              <div class="summary">{summary}</div>
            {/each}
          </div>
        </div>

        <div class="side-panel">
          <div class="find-bar-container">
            <Icon name="search"/>
            <input class="find-input"
                   type="text"
                   autocomplete="off"
                   aria-label="Find in the transcript"
                   placeholder="Find in the transcript"
                   bind:value={findInTranscript}>
          </div>
          {#if showSidePanel}
            <div class="transcript-container">
              {#if findInTranscript && $filteredMatchingParagraphs.length === 0}
                <strong>{findInTranscript}</strong> not found in your search results…
              {/if}
              <ul class="paragraphs-container">
                {#each $filteredMatchingParagraphs as paragraph}
                  <ParagraphPlayer {paragraph}
                                   selected="{paragraph.pid === paragraphInPlay.pid}"
                                   stack
                                   on:play={(event) => playTranscript(event.detail.paragraph)}/>
                {/each}
              </ul>
            </div>
          {/if}
          <div tabindex="0"
               class="transcript-expander-header"
               class:expanded={showFullTranscripts}
               on:click={toggleTranscriptPanel}
               on:keyup={(e) => { if (e.key === 'Enter') toggleTranscriptPanel(); }}>
            <div tabindex="-1" class="transcript-expander-header-title">
              <strong>Full transcript</strong>
            </div>
            <div tabindex="-1" class="transcript-expander-header-chevron">
              <Icon name="chevron-right"/>
            </div>
          </div>
          {#if showFullTranscripts}
            <div class="transcript-container">
              <ul class="paragraphs-container">
                {#each filteredTranscripts as paragraph}
                  <ParagraphPlayer {paragraph}
                                   selected="{paragraph === paragraphInPlay}"
                                   stack
                                   on:play={(event) => playTranscript(event.detail.paragraph)}/>
                {/each}
              </ul>
            </div>
          {/if}
        </div>
      {/if}
    </div>
  {:else}
    <ThumbnailPlayer thumbnail="{result.thumbnail}"
                     on:play={playFromStart}/>

    <div class="result-details">
      <h3 class="ellipsis">{result?.title}</h3>
      <ul class="paragraphs-container">
        {#each $matchingParagraphs.slice(0, displayedResultCount) as paragraph}
          <ParagraphPlayer {paragraph}
                           ellipsis
                           on:play={(event) => playParagraph(event.detail.paragraph)}/>
        {/each}
      </ul>
      {#if $matchingParagraphs.length > 4}
        <div class="all-result-toggle"
             class:expanded={showAllResults}
             on:click={() => showAllResults = !showAllResults}>
          Display {showAllResults ? 'less' : 'all'} results

          <div class="icon">
            <Icon name="chevron-right" size="small"/>
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style>
  .video-tile {
    --width-thumbnail: var(--rhythm-28);
    --flex-gap: var(--rhythm-2);

    align-items: center;
    display: flex;
    gap: var(--flex-gap);
    transition: background var(--transition-superfast);
  }
  .video-tile.showAllResults {
    align-items: flex-start;
  }

  .video-tile h3 {
    font-size: var(--font-size-title-m);
    font-weight: var(--font-weight-title-m);
    line-height: var(--line-height-title-m);
    margin: 0 0 var(--rhythm-1);
  }

  .video-tile .all-result-toggle {
    align-items: center;
    color: var(--color-neutral-regular);
    cursor: pointer;
    display: flex;
    font-weight: var(--font-weight-semi-bold);
    gap: var(--rhythm-1);
    line-height: var(--rhythm-3);
    margin-top: var(--rhythm-2);
  }
  .video-tile .all-result-toggle:hover {
    color: var(--color-neutral-strong);
  }
  .video-tile .all-result-toggle .icon {
    display: flex;
    transition: transform var(--transition-superfast);
  }
  .video-tile .all-result-toggle.expanded .icon {
    transform: rotate(-90deg);
  }

  .video-tile:not(.expanded) {
    width: 1024px;
  }
  .video-tile.expanded {
    background: var(--color-neutral-lightest);
    border-radius: var(--border-radius);
    flex-direction: column;
    overflow: hidden;
    padding: var(--rhythm-2);
  }

  .video-tile.expanded header {
    align-items: center;
    display: flex;
    gap: var(--rhythm-2);
    justify-content: space-between;
    width: 100%;
  }

  .video-tile.expanded header h3 {
    margin: 0;
  }

  .result-details {
    width: calc(100% - var(--width-thumbnail) - var(--flex-gap));
  }

  .video-tile .paragraphs-container {
    display: flex;
    flex: 0 0 auto;
    flex-direction: column;
    gap: var(--rhythm-0_5);
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .ellipsis {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .expanded-tile-content {
    display: flex;
    gap: var(--rhythm-2);
  }

  .video-tile .transcript-container .paragraphs-container {
    gap: var(--rhythm-3);
  }

  .side-panel {
    display: flex;
    flex: 1 0 auto;
    flex-direction: column;
    width: var(--rhythm-56);
  }

  .find-bar-container {
    align-items: center;
    background: var(--color-light-stronger);
    display: flex;
    height: var(--rhythm-5);
    gap: var(--rhythm-1);
    margin-bottom: var(--rhythm-1);
    padding-left: var(--rhythm-1);
  }

  .find-bar-container .find-input {
    border: none;
    box-sizing: border-box;
    color: inherit;
    flex: 1 0 auto;
    font-family: inherit;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-body);
    line-height: var(--rhythm-4);
  }

  .find-bar-container .find-input:focus {
    outline: 0;
  }

  .transcript-expander-header,
  .transcript-container {
    background: var(--color-light-stronger);
    padding: var(--rhythm-1_5);
  }

  .transcript-expander-header {
    align-items: center;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    margin-top: var(--rhythm-1);
  }

  .transcript-expander-header:focus {
    box-shadow: var(--focus-shadow);
    outline: 0;
  }

  .transcript-expander-header .transcript-expander-header-chevron {
    transition: transform var(--transition-superfast);
  }

  .transcript-expander-header.expanded .transcript-expander-header-chevron {
    transform: rotate(90deg);
  }

  .transcript-expander-header-title {
    flex: 1 0 auto;
  }

  .expanded-tile-content .transcript-container {
    max-height: 500px;
    overflow: auto;
  }
  .expanded-tile-content.full-transcript-expanded .transcript-container {
    max-height: 320px;
  }

  .expanded-tile-content .summary-container {
    margin-top: var(--rhythm-3);
  }

  @media (max-width: 1400px) {
    .expanded-tile-content {
      flex-direction: column;
    }
  }

  mark {
    background-color: transparent;
    font-weight: var(--font-weight-semi-bold);
  }
</style>
