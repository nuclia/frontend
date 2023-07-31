<script lang="ts">
  import { getFieldUrl, getPdfJsBaseUrl, getPdfJsStyle, selectedParagraph } from '../../../core';
  import { Observable } from 'rxjs';
  import { isMobileViewport } from '../../../common';
  import { PdfRendering } from './renderings';

  const pdfUrl: Observable<string> = getFieldUrl(true);
  const pdfStyle = getPdfJsStyle();
  const pdfJsBaseUrl = getPdfJsBaseUrl();
  const pdfOverrideStyle = `.nuclia-widget .textLayer .highlight.selected {
    background-color: var(--color-primary-regular);
    border-radius: 0;
    margin: -4px;
    padding: 2px 4px;
  }`;
  let pdfJsLoaded = false;
  let pdfViewerLoaded = false;
  const onPdfJsLoad = () => {
    pdfJsLoaded = true;
  };
  const onPdfViewerLoad = () => {
    pdfViewerLoaded = true;
  };

  let innerWidth = window.innerWidth;
  $: isMobile = isMobileViewport(innerWidth);
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

<div class="sw-pdf-renderer">
  {#if pdfViewerLoaded && $pdfUrl}
    <PdfRendering
      src={$pdfUrl}
      paragraph={$selectedParagraph}
      showController={!isMobile} />
  {/if}
</div>

<style>
  .sw-pdf-renderer {
    height: calc(100vh - var(--renderer-outer-space));
    position: relative;
  }
</style>
