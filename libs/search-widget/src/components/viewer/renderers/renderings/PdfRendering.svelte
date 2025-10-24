<script lang="ts">
  import type { Search } from '@nuclia/core';
  import type { Subscription } from 'rxjs';
  import { debounceTime, filter, Subject } from 'rxjs';
  import { onDestroy, onMount } from 'svelte';
  import { IconButton, isMobileViewport, Spinner } from '../../../../common';
  import { getVendorsCDN, getPdfSrc } from '../../../../core';
  import { getUnMarked } from '../../utils';

  interface Props {
    src: string;
    paragraph: Search.FindParagraph;
    showController?: boolean;
  }

  let { src, paragraph, showController = true }: Props = $props();

  const pdfJsLib = window['pdfjs-dist/build/pdf'];
  const pdfJsViewer = window['pdfjs-dist/web/pdf_viewer'];
  pdfJsLib.GlobalWorkerOptions.workerSrc = `${getVendorsCDN()}/pdf.worker.js`;

  let innerWidth = $state(window.innerWidth);
  let pdfContainerElement: HTMLElement = $state();
  let containerOffsetWidth = $state();
  let pdfViewer = $state();
  let eventBus;
  let findController;
  let linkService;

  let currentPage = $state(1);
  let totalPage = $state(1);
  let zoom: number = $state(1);
  let pdfInitialized = $state(false);
  let dragMode = $state(false);
  let isDragging = $state(false);

  const updateTextLayerMatch$: Subject<{ paragraphFound: boolean; page: number }> = new Subject<{
    paragraphFound: boolean;
    page: number;
  }>();
  const subscriptions: Subscription[] = [];

  onMount(() => {
    loadPdf();

    subscriptions.push(
      updateTextLayerMatch$
        .pipe(
          // When pdfjs find a match, updateTextLayerMatch event is sent twice: first with pageIndex -1, then with the right pageIndex
          // we debounce to ignore the pageIndex -1 sent when paragraph is found
          debounceTime(50),
          filter((data) => !data.paragraphFound),
        )
        .subscribe(() => {
          // Paragraph not found in PDF, go to paragraph page
          const pageNumber = paragraph?.position.page_number;
          if (pageNumber) {
            pdfViewer.scrollPageIntoView({ pageNumber: pageNumber + 1 });
          }
        }),
    );
  });

  onDestroy(() => {
    subscriptions.forEach((subscription) => subscription.unsubscribe());
  });

  function loadPdf() {
    if (!src || !pdfContainerElement) {
      return;
    }
    // initialise PDF.js
    eventBus = new pdfJsViewer.EventBus();
    linkService = new pdfJsViewer.PDFLinkService({ eventBus });
    findController = new pdfJsViewer.PDFFindController({ eventBus, linkService });
    pdfViewer = new pdfJsViewer.PDFViewer({
      container: pdfContainerElement,
      removePageBorders: true,
      eventBus,
      findController,
      linkService,
    });
    linkService.setViewer(pdfViewer);

    // Load the pdf and pass it to PDF.js
    const loadingTask = pdfJsLib.getDocument(getPdfSrc(src));
    loadingTask.promise.then(
      (pdf) => {
        pdfViewer.setDocument(pdf);
        linkService.setDocument(pdf);
      },
      (reason) => {
        console.error(`Loading PDF failed`, reason);
      },
    );

    // Display the right page and highlight the paragraph
    eventBus.on('pagesinit', () => {
      totalPage = pdfViewer.pagesCount;
      pdfViewer.currentScaleValue = scale;
      zoom = pdfViewer.currentScale;
      pdfInitialized = true;

      if (paragraph?.text) {
        findSelectedText();
      }
    });

    eventBus.on('pagechanging', (event) => {
      currentPage = event.pageNumber;
    });

    eventBus.on('updatetextlayermatches', (event) => {
      updateTextLayerMatch$.next({ paragraphFound: event.pageIndex > 0, page: event.pageIndex });
    });
  }

  function findSelectedText() {
    const query = getUnMarked(paragraph.text);
    eventBus.dispatch('find', {
      caseSensitive: true,
      phraseSearch: true,
      query,
    });
  }

  function unselectText() {
    eventBus.dispatch('find', { query: '' });
  }

  const zoomIn = () => {
    if (pdfViewer) {
      pdfViewer.increaseScale();
      zoom = pdfViewer.currentScale;
    }
  };

  const zoomOut = () => {
    if (pdfViewer) {
      pdfViewer.decreaseScale();
      zoom = pdfViewer.currentScale;
    }
  };

  const previousPage = () => {
    if (pdfViewer) {
      pdfViewer.previousPage();
    }
  };

  const nextPage = () => {
    if (pdfViewer) {
      pdfViewer.nextPage();
    }
  };

  const toggleDragMode = () => {
    dragMode = !dragMode;
  };

  const handleMouseDown = (event: MouseEvent) => {
    if (dragMode) {
      isDragging = true;
    }
  };

  const endDragging = () => {
    isDragging = false;
  };

  const handleMouseMove = (event: MouseEvent) => {
    if (!dragMode || !isDragging) return;
    event.preventDefault();
    event.stopPropagation();
    pdfContainerElement.scrollTop -= event.movementY;
    pdfContainerElement.scrollLeft -= event.movementX;
  };

  function resize() {
    if (!!pdfViewer && pdfInitialized) {
      pdfViewer.currentScaleValue = scale;
    }
  }
  $effect(() => {
    if (pdfViewer && paragraph && paragraph.text) {
      findSelectedText();
    }
  });
  $effect(() => {
    if (pdfViewer && !paragraph) {
      unselectText();
    }
  });

  let isMobile = $derived(isMobileViewport(innerWidth));
  let scale = $derived(isMobile ? 'page-fit' : 'auto');
</script>

<svelte:window
  bind:innerWidth
  onresize={resize} />
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  class="pdf-container"
  bind:this={pdfContainerElement}
  bind:offsetWidth={containerOffsetWidth}
  style:--container-width="{containerOffsetWidth}px"
  style:position="absolute"
  class:drag-mode={dragMode}
  class:dragging={isDragging}
  onmousedown={handleMouseDown}
  onmouseleave={endDragging}
  onmouseup={endDragging}
  onmousemove={handleMouseMove}>
  <div class="pdfViewer"></div>
  {#if !src || !pdfInitialized}
    <div class="loading-container">
      <Spinner />
    </div>
  {/if}

  {#if showController}
    <div class="pdf-controller">
      <div class="pdf-navigator">
        <IconButton
          icon="circle-chevron-left"
          aspect="basic"
          size="small"
          on:click={previousPage} />
        <IconButton
          icon="circle-chevron-right"
          aspect="basic"
          size="small"
          on:click={nextPage} />
      </div>

      <span>{currentPage} / {totalPage}</span>

      <div class="pdf-zoom-container">
        <IconButton
          icon="circle-minus"
          aspect="basic"
          size="small"
          on:click={zoomOut} />
        <IconButton
          icon="circle-plus"
          aspect="basic"
          size="small"
          on:click={zoomIn} />
      </div>
      <span>{Math.round(zoom * 100)}%</span>

      <div class="pdf-drag">
        <IconButton
          icon="fullscreen"
          aspect="basic"
          size="small"
          active={dragMode}
          on:click={toggleDragMode} />
      </div>
    </div>
  {/if}
</div>

<style src="./PdfRendering.css"></style>
