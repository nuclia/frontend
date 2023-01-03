<script lang="ts">
  import { getCDN } from '../../core/utils';
  import { viewerState, viewerStore, pdfUrl, clearSearch } from '../../core/stores/viewer.store';
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

<div class="sw-preview">
  <div class="actions">
    <button on:click={closePreview}>
      <img
        src={`${getCDN()}icons/close.svg`}
        alt="icon" />
    </button>
  </div>
  {#if $pdfPreview}
    <Pdf
      src={$pdfUrl.uri}
      query={$pdfPreview.query}
      currentPage={$pdfPreview.page}
      totalPages={$pdfPreview.total} />
  {/if}
  {#if $mediaPreview}
    <Player
      time={$mediaPreview.time}
      src={$mediaPreview.file.uri}
      type={$mediaPreview.file.content_type} />
  {/if}
  {#if $youtubePreview}
    <Youtube
      time={$youtubePreview.time}
      uri={$youtubePreview.uri} />
  {/if}
  {#if $linkPreview}
    <Pdf src={$linkPreview.file.uri} />
  {/if}
</div>

<style
  lang="scss"
  src="./Preview.scss"></style>
