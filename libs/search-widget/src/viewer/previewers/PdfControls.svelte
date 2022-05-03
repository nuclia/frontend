<script lang="ts">
  import { getCDN } from '../../core/utils';
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

<div class="pdf-controls">
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

<style>
  .pdf-controls {
    display: inline-flex;
    align-items: center;
    height: 29px;
    padding: 0 13px;
    background: #e5e5e5;
    border-radius: 4px;
    color: rgba(0, 0, 0, 0.7);
  }
  .pdf-controls button {
    padding: 0;
    border: 0;
    margin: 0 4px 0 0;
    background: transparent;
    -webkit-appearance: none;
  }
  .pdf-controls button:not([disabled]) {
    cursor: pointer;
  }
  .pdf-controls button[disabled] {
    opacity: 0.4;
  }
  .pdf-controls button img {
    display: block;
    width: 14px;
    height: 14px;
  }
  .button-group {
    display: inline-flex;
    align-items: center;
    margin-right: 32px;
  }
  .button-group:last-child {
    margin-right: 0;
  }
  .pagination {
    font-size: 10px;
  }
  .pagination span {
    text-decoration: underline;
  }
  .zoom {
    padding-left: 2px;
    font-size: 10px;
    text-decoration: underline;
  }
</style>
