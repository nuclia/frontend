<script lang="ts">
  import { getPdfJsBaseUrl } from '../../core/utils';
  import { onMount } from 'svelte';
  import IconButton from '../../common/button/IconButton.svelte';

  export let src: string;
  export let paragraph;
  export let showController = true;

  const pdfJsLib = window['pdfjs-dist/build/pdf'];
  const pdfJsViewer = window['pdfjs-dist/web/pdf_viewer']
  pdfJsLib.GlobalWorkerOptions.workerSrc = `${getPdfJsBaseUrl()}/pdf.worker.js`;

  let innerHeight = window.innerHeight;
  let innerWidth = window.innerWidth;
  let pdfContainerElement: HTMLElement;
  let pdfViewer;
  let eventBus;
  let findController;
  let linkService;

  let currentPage = 1;
  let totalPage = 1;
  let zoom: number = 1;
  let pdfInitialized = false;

  $: src && loadPdf();
  $: paragraph && pdfViewer && paragraph.text && findSelectedText();

  onMount(() => {
    loadPdf();
  });

  function loadPdf() {
    if (!src || !pdfContainerElement) {
      return;
    }
    // initialise PDF.js
    eventBus = new pdfJsViewer.EventBus();
    linkService = new pdfJsViewer.PDFLinkService({eventBus});
    findController = new pdfJsViewer.PDFFindController({eventBus, linkService});
    pdfViewer = new pdfJsViewer.PDFViewer({
      container: pdfContainerElement,
      removePageBorders: true,
      eventBus,
      findController,
      linkService,
    });
    linkService.setViewer(pdfViewer);

    // Load the pdf and pass it to PDF.js
    const loadingTask = pdfJsLib.getDocument(src);
    loadingTask.promise.then((pdf) => {
      pdfViewer.setDocument(pdf);
      linkService.setDocument(pdf);
    }, (reason) => {
      console.error(`Loading PDF failed`, reason);
    });

    // Display the right page and highlight the paragraph
    eventBus.on('pagesinit', () => {
      totalPage = pdfViewer.pagesCount;
      pdfViewer.currentScaleValue = 'page-fit';
      zoom = pdfViewer.currentScale;
      pdfInitialized = true;

      const pageNumber = paragraph?.page;
      if (pageNumber) {
        pdfViewer.scrollPageIntoView({pageNumber})
      }
      if (paragraph?.text) {
        findSelectedText();
      }
    });

    eventBus.on('pagechanging', (event) => {
      currentPage = event.pageNumber;
    });
  }

  function findSelectedText() {
    eventBus.dispatch('find', {
      caseSensitive: true,
      phraseSearch: true,
      query: paragraph.text
    });
  }

  const zoomIn = () => {
    if (pdfViewer) {
      pdfViewer.increaseScale();
      zoom = pdfViewer.currentScale;
    }
  }

  const zoomOut = () => {
    if (pdfViewer) {
      pdfViewer.decreaseScale();
      zoom = pdfViewer.currentScale;
    }
  }

  const previousPage = () => {
    if (pdfViewer) {
      pdfViewer.previousPage();
    }
  }

  const nextPage = () => {
    if (pdfViewer) {
      pdfViewer.nextPage();
    }
  }

  const resize = () => {
    if (!!pdfViewer && pdfInitialized) {
      pdfViewer.currentScaleValue = 'page-fit';
    }
  }
</script>

<svelte:window on:resize={resize}/>
<div class="pdf-container" bind:this={pdfContainerElement}>
  <div class="pdfViewer"></div>

  {#if showController}
    <div class="pdf-controller">
      <div class="pdf-navigator">
        <IconButton icon="circle-chevron-left"
                    aspect="basic"
                    size="small"
                    on:click={previousPage}/>
        <IconButton icon="circle-chevron-right"
                    aspect="basic"
                    size="small"
                    on:click={nextPage}/>
      </div>

      <span>{currentPage} / {totalPage}</span>

      <div class="pdf-zoom-container">
        <IconButton icon="circle-minus"
                    aspect="basic"
                    size="small"
                    on:click={zoomOut} />
        <IconButton icon="circle-plus"
                    aspect="basic"
                    size="small"
                    on:click={zoomIn} />
      </div>
      <span>{Math.round(zoom * 100)}%</span>
    </div>
  {/if}
</div>

<style lang="scss" src="./PdfViewer.scss"></style>
