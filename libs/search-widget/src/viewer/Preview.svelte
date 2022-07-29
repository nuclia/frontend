<script lang="ts">
  import { getCDN } from '../core/utils';
  import { _ } from '../core/i18n';
  import { viewerState, viewerStore, pdfUrl, clearSearch } from './store';
  import Pdf from './previewers/Pdf.svelte';
  import Player from './previewers/Player.svelte';
  import Youtube from './previewers/Youtube.svelte';
  import { take } from 'rxjs';

  const pdfPreview = viewerState.pdfPreview;
  const linkPreview = viewerState.linkPreview;
  const mediaPreview = viewerState.mediaPreview;
  const youtubePreview = viewerState.youtubePreview;

  const closePreview = () => {
    viewerState.onlySelected.pipe(take(1)).subscribe((onlySelected) => {
      viewerStore.showPreview.next(false);
      if (onlySelected) {
        clearSearch();
      }
    });
  };
</script>

<div class="preview">
  <div class="actions">
    <button on:click={closePreview}>
      <img src={`${getCDN()}icons/close.svg`} alt="icon" />
    </button>
  </div>
  {#if $pdfPreview}
    <Pdf src={$pdfUrl.uri} query={$pdfPreview.query} currentPage={$pdfPreview.page} totalPages={$pdfPreview.total} />
  {/if}
  {#if $mediaPreview}
    <Player time={$mediaPreview.time} src={$mediaPreview.file.uri} type={$mediaPreview.file.content_type} />
  {/if}
  {#if $youtubePreview}
    <Youtube time={$youtubePreview.time} uri={$youtubePreview.uri} />
  {/if}
  {#if $linkPreview}
    <Pdf src={$linkPreview.file.uri} />
  {/if}
</div>

<style>
  .preview {
    position: sticky;
    top: calc(var(--header-height) + 1em)
  }
  .actions {
    text-align: right;
    margin-bottom: 1em;
  }
  .actions button {
    border: 0;
    padding: 0;
    background: transparent;
    cursor: pointer;
    -webkit-appearance: none;
  }
</style>
