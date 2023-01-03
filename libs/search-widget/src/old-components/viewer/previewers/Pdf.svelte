<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { Subject, switchMap, tap } from 'rxjs';
  import { getFile } from '../../../core/api';
  import { viewerStore } from '../../../core/old-stores/viewer.store';
  import PdfControls from './PdfControls.svelte';
  import LoadingDots from '../../../common/spinner/LoadingDots.svelte';

  export let src: string;
  export let query: string = '';
  export let currentPage: number | undefined = undefined;
  export let totalPages: number | undefined = undefined;

  const pdfChanged = new Subject<string>();
  const objectsUrl: string[] = [];

  let pdfLoaded = false;
  let isInitialized = false;
  let pdfViewer: any;
  let pdfjsLib: any;
  let pdfjsViewer: any;
  let pdfLinkService: any;
  let eventBus: any;
  let pdfContainer: HTMLElement;

  let zoom: number = 1;
  let loading = true;

  $: if (isInitialized && src) pdfChanged.next(src);
  $: if (isInitialized && query) find(query);

  onMount(() => {});

  const zoomIn = () => {
    pdfViewer.increaseScale();
    zoom = pdfViewer._currentScale;
  };
  const zoomOut = () => {
    pdfViewer.decreaseScale();
    zoom = pdfViewer._currentScale;
  };

  const subscriptions = [
    pdfChanged
      .pipe(
        switchMap((path) => getFile(path)),
        tap((path) => {
          objectsUrl.push(path);
        }),
      )
      .subscribe((path) => {
        loadPdf(path);
      }),
  ];

  onDestroy(() => {
    subscriptions.forEach((sub) => sub.unsubscribe());
    objectsUrl.forEach((object) => URL.revokeObjectURL(object));
  });

  const loadPdf = (path: string) => {
    // Some PDFs need external cmaps
    const CMAP_URL = 'https://unpkg.com/pdfjs-dist@2.13.216/cmaps/';
    const CMAP_PACKED = true;

    const loadingTask = pdfjsLib.getDocument({
      url: path,
      cMapUrl: CMAP_URL,
      cMapPacked: CMAP_PACKED,
    });
    (async function () {
      const pdfDocument = await loadingTask.promise;
      pdfViewer.setDocument(pdfDocument);
      loading = false;
      pdfLinkService.setDocument(pdfDocument, null);
    })();
  };

  const initViewer = () => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@2.13.216/build/pdf.worker.min.js';

    const container = pdfContainer;
    eventBus = new pdfjsViewer.EventBus();

    // Enable hyperlinks within PDF files
    pdfLinkService = new pdfjsViewer.PDFLinkService({
      eventBus,
    });

    // Enable find controller
    const pdfFindController = new pdfjsViewer.PDFFindController({
      eventBus,
      linkService: pdfLinkService,
    });

    pdfViewer = new pdfjsViewer.PDFSinglePageViewer({
      container,
      eventBus,
      linkService: pdfLinkService,
      findController: pdfFindController,
    });
    pdfLinkService.setViewer(pdfViewer);

    eventBus.on('pagesinit', function () {
      pdfViewer.currentScaleValue = 'page-width';
      zoom = pdfViewer._currentScale;
      if (query) {
        find(query);
      }
    });
  };

  const find = (query: string) => {
    // TODO: pdf search is still not reliable enough
    eventBus.dispatch('find', {
      caseSensitive: true,
      findPrevious: undefined,
      highlightAll: true,
      phraseSearch: true,
      query,
    });
  };

  const onLoad = () => {
    pdfLoaded = true;
  };

  const onLoadViewer = () => {
    pdfjsLib = (window as any)['pdfjs-dist/build/pdf'];
    pdfjsViewer = (window as any)['pdfjs-dist/web/pdf_viewer'];
    if (!pdfjsLib?.getDocument || !pdfjsViewer?.PDFSinglePageViewer) {
      return;
    }
    initViewer();
    isInitialized = true;
  };
</script>

<svelte:head>
  <script
    src="https://unpkg.com/pdfjs-dist@2.13.216/build/pdf.min.js"
    on:load={onLoad}></script>
  {#if pdfLoaded}
    <script
      src="https://unpkg.com/pdfjs-dist@2.13.216/web/pdf_viewer.js"
      on:load={onLoadViewer}></script>
  {/if}
</svelte:head>

<div class="sw-pdf-viewer">
  {#if isInitialized}
    <div class="controls">
      <PdfControls
        {currentPage}
        {totalPages}
        {zoom}
        on:zoomIn={zoomIn}
        on:zoomOut={zoomOut}
        on:pageChange={(e) => {
          viewerStore.setPage.next(e.detail);
        }} />
    </div>
  {/if}
  <div
    class="pdf"
    role={loading ? 'alert' : null}
    aria-live={loading ? 'assertive' : null}>
    {#if loading}
      <div class="loading-dots">
        <LoadingDots />
      </div>
    {/if}
    <link
      rel="stylesheet"
      href="https://unpkg.com/pdfjs-dist@2.13.216/web/pdf_viewer.css" />
    <div
      id="viewerContainer"
      bind:this={pdfContainer}>
      <div
        id="viewer"
        class="pdfViewer" />
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./Pdf.scss"></style>
