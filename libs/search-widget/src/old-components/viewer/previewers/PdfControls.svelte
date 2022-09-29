<script lang="ts">
  import { getCDN } from '../../../core/utils';
  import { createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  export let currentPage: number | undefined = undefined;
  export let totalPages: number | undefined = undefined;
  export let showNavigation = false;
  export let zoom: number;

  const zoomIn = () => {
    dispatch('zoomIn');
  };

  const zoomOut = () => {
    dispatch('zoomOut');
  };

  const prevPage = () => {
    dispatch('pageChange', currentPage! - 1);
  };
  const nextPage = () => {
    dispatch('pageChange', currentPage! + 1);
  };
</script>

<div class="sw-pdf-controls">
  {#if showNavigation && currentPage !== undefined && totalPages !== undefined}
    <div class="button-group">
      <button on:click={prevPage} disabled={currentPage === 0}>
        <img src={`${getCDN()}icons/prev.svg`} alt="icon" />
      </button>
      <button on:click={nextPage} disabled={currentPage === totalPages}>
        <img src={`${getCDN()}icons/next.svg`} alt="icon" />
      </button>
      <span class="pagination">
        <span>{currentPage + 1}</span> / {totalPages}
      </span>
    </div>
  {/if}
  <div class="button-group">
    <button on:click={zoomOut}>
      <img src={`${getCDN()}icons/decrease.svg`} alt="icon" />
    </button>
    <button on:click={zoomIn}>
      <img src={`${getCDN()}icons/increase.svg`} alt="icon" />
    </button>
    <span class="zoom">{Math.round(zoom * 100)}%</span>
  </div>
</div>

<style lang="scss" src="./PdfControls.scss"></style>
