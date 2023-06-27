<script lang="ts">
  import type { Search } from '@nuclia/core';
  import PdfViewer from './viewers/PdfViewer.svelte';
  import type { Observable } from 'rxjs';
  import { getCDN, getPdfJsBaseUrl, getPdfJsStyle } from '../core/utils';
  import type { WidgetParagraph } from '../core/models';
  import { PreviewKind } from '../core/models';
  import { getFieldUrl } from '../core/stores/viewer.store';
  import DocumentTile from './base-tile/DocumentTile.svelte';
  import { isMobileViewport } from '../common/utils';

  export let result: Search.FieldResult;

  const pdfStyle = getPdfJsStyle();
  const pdfJsBaseUrl = getPdfJsBaseUrl();
  const pdfOverrideStyle = `.nuclia-widget .textLayer .highlight.selected {
    background-color: var(--color-primary-regular);
    border-radius: 0;
    margin: -4px;
    padding: 2px 4px;
  }`;

  let innerWidth = window.innerWidth;

  let selectedParagraph: WidgetParagraph | undefined;
  let pdfUrl: Observable<string>;

  $: isMobile = isMobileViewport(innerWidth);

  const openParagraph = (paragraph) => {
    selectedParagraph = paragraph;
    if (!pdfUrl) {
      pdfUrl = getFieldUrl(true);
    }
  };

  let pdfJsLoaded = false;
  let pdfViewerLoaded = false;
  const onPdfJsLoad = () => {
    pdfJsLoaded = true;
  };
  const onPdfViewerLoad = () => {
    pdfViewerLoaded = true;
  };
</script>

<svelte:window bind:innerWidth />
<svelte:head>
  <script
    src="{pdfJsBaseUrl}/build/pdf.min.js"
    on:load={onPdfJsLoad}></script>
  {#if pdfJsLoaded}
    <script
      src="{pdfJsBaseUrl}/web/pdf_viewer.js"
      on:load={onPdfViewerLoad}></script>
  {/if}
</svelte:head>
{#if $pdfStyle}
  <svelte:element this="style">{@html $pdfStyle}</svelte:element>
{/if}
<svelte:element this="style">{@html pdfOverrideStyle}</svelte:element>

<DocumentTile
  previewKind={PreviewKind.PDF}
  fallbackThumbnail={`${getCDN()}icons/application/pdf.svg`}
  {result}
  on:selectParagraph={(event) => openParagraph(event.detail)}>
  {#if pdfViewerLoaded && $pdfUrl}
    <PdfViewer
      src={$pdfUrl}
      paragraph={selectedParagraph}
      showController={!isMobile} />
  {/if}
</DocumentTile>
