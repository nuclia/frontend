<script lang="ts">

  import type { Observable } from 'rxjs';
  import type { IResource, Resource, Search } from '@nuclia/core';
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

  export let result: IResource = {id: ''};

  let resource: Observable<Resource>;
  let expanded = false;
  let summaries = [];
  let videoTime = 0;
  let youtubeUri: string | undefined;
  let paragraphInPlay: MediaWidgetParagraph | undefined;
  let transcripts: MediaWidgetParagraph[] = [];
  let showTranscripts = false;

  const matchingParagraphs = nucliaState().getMatchingParagraphs(result.id);

  const playFromStart = () => {
    playFrom(0);
  };

  const playParagraph = (paragraph) => {
    // FIXME once Ramon will have the timestamp in the search results
    // playFrom(paragraph.time, paragraph);
    paragraphInPlay = paragraph;
    playFrom(450, paragraph);
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

  const closePreview = () => {
    expanded = false;
  };

  const toggleTranscriptPanel = () => {
    showTranscripts = !showTranscripts;
  }
</script>


<div class="video-tile"
     class:expanded>
  {#if expanded}
    <header>
      <h3 class="ellipsis">{result?.title}</h3>
      <CloseButton aspect="basic"
                   on:click={closePreview}/>
    </header>
    <div class="expanded-tile-content">
      {#if $resource}
        <div class="video-and-summary-container">
          {#if youtubeUri}
            <Youtube time={videoTime} uri={youtubeUri}/>
          {/if}
          <div class="summary-container">
            {#each summaries as summary}
              <div class="summary">{summary}</div>
            {/each}
          </div>
        </div>

        <div class="side-panel">
          <div class="transcript-container">
            <ul class="paragraphs-container">
              {#each $matchingParagraphs as paragraph}
                <ParagraphPlayer {paragraph}
                                 selected="{paragraph === paragraphInPlay}"
                                 stack
                                 on:play={(event) => playTranscript(event.detail.paragraph)}/>
              {/each}
            </ul>
          </div>
          <div tabindex="0"
               class="transcript-expander-header"
               class:expanded={showTranscripts}
               on:click={toggleTranscriptPanel}
               on:keyup={(e) => { if (e.key === 'Enter') toggleTranscriptPanel(); }}>
            <div tabindex="-1" class="transcript-expander-header-title">
              <strong>Full transcript</strong>
            </div>
            <svg tabindex="-1" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <path fill-rule="evenodd"
                    d="m9.707 18.707-1.414-1.414L13.586 12 8.293 6.707l1.414-1.414L16.414 12l-6.707 6.707Z"
                    clip-rule="evenodd"/>
            </svg>
          </div>
          {#if showTranscripts}
            <div class="transcript-container">
              <ul class="paragraphs-container">
                {#each transcripts as paragraph}
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
        <!-- TODO: show all matches -->
        {#each $matchingParagraphs.slice(0, 4) as paragraph}
          <ParagraphPlayer {paragraph}
                           ellipsis
                           on:play={(event) => playParagraph(event.detail.paragraph)}/>
        {/each}
      </ul>
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

  .video-tile h3 {
    font-size: var(--font-size-title-m);
    font-weight: var(--font-weight-title-m);
    line-height: var(--line-height-title-m);
    margin: 0 0 var(--rhythm-2);
  }

  .video-tile.expanded {
    background: var(--color-neutral-lightest);
    border-radius: var(--border-radius);
    flex-direction: column;
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
  .transcript-expander-header svg {
    transition: transform var(--transition-superfast);
  }
  .transcript-expander-header.expanded svg {
    transform: rotate(90deg);
  }

  .transcript-expander-header-title {
    flex: 1 0 auto;
  }

  .expanded-tile-content .transcript-container {
    overflow: auto;
  }

  .expanded-tile-content .summary-container {
    margin: var(--rhythm-3) 0;
  }

  @media (max-width: 1400px) {
    .expanded-tile-content {
      flex-direction: column;
    }
  }
</style>
