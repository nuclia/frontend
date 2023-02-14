<script lang="ts">
  import { Resource, Search } from '@nuclia/core';
  import PdfViewer from './PdfViewer.svelte';
  import { map, Observable, of, shareReplay, switchMap } from 'rxjs';
  import { getFileUrl, getResource } from '../../core/api';
  import { getCDN, getFileField, getPdfJsBaseUrl, getPdfJsStyle } from '../../core/utils';
  import { PreviewKind, WidgetParagraph } from '../../core/models';
  import DocumentTile from '../base-tile/DocumentTile.svelte';

  export let result: Search.SmartResult = { id: '' } as Search.SmartResult;

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

  $: isMobile = innerWidth < 448;

  let resource$: Observable<Resource> = getResource(result.id).pipe(shareReplay());

  const openParagraph = (paragraph) => {
    selectedParagraph = paragraph;
    if (!pdfUrl) {
      pdfUrl = resource$.pipe(
        map((res) => {
          const fileField = getFileField(res, result.field?.field_id || '');
          return fileField?.value?.file;
        }),
        switchMap((url) => (url ? getFileUrl(url.uri) : of(''))),
      );
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
  resourceObs={resource$}
  on:selectParagraph={(event) => openParagraph(event.detail.paragraph)}>
  {#if pdfViewerLoaded}
    <PdfViewer
      src={$pdfUrl}
      paragraph={selectedParagraph}
      showController={!isMobile} />
  {/if}
</DocumentTile>
