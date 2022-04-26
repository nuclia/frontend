<script lang="ts">
  import { getCDN } from '../core/utils';
  import { _ } from '../core/i18n';
  import { viewerState, viewerStore, pdfUrl } from './store';
  import Pdf from './previewers/Pdf.svelte';
  import Player from './previewers/Player.svelte';

  const pdfPreview = viewerState.pdfPreview;
  const linkPreview = viewerState.linkPreview;
  const mediaPreview = viewerState.mediaPreview;

  const closePreview = () => {
    viewerStore.showPreview.next(false);
  };
</script>

<div class="preview">
  <button on:click={closePreview}>
    <img src={`${getCDN()}icons/close.svg`} alt="icon" />
    <span>{$_('resource.close_preview')}</span>
  </button>
  {#if $pdfPreview}
    <Pdf src={$pdfUrl.uri} query={$pdfPreview.query} currentPage={$pdfPreview.page} totalPages={$pdfPreview.total} />
  {/if}
  {#if $mediaPreview}
    <Player time={$mediaPreview.time} src={$mediaPreview.file.uri} type={$mediaPreview.file.content_type} />
  {/if}
  {#if $linkPreview}
    <Pdf src={$linkPreview.file.uri} />
  {/if}
</div>

<style>
  .preview {
    position: sticky;
    top: 1em;
  }
  .preview button {
    display: flex;
    align-items: center;
    margin-bottom: 1em;
    border: 0;
    padding: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-weight: var(--font-weight-bold);
    cursor: pointer;
    -webkit-appearance: none;
  }
  .preview button img {
    width: 12px;
    height: auto;
    margin-right: 10px;
  }
</style>
