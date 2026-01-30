<script lang="ts">
  import type { Memory } from '@nuclia/core';
  import { onDestroy, tick } from 'svelte';
  import { getVendorsCDN } from '../../core';

  interface Props {
    data: Memory.DataVisualization;
  }

  let { data }: Props = $props();

  let vegaLoaded = $state(false);
  let vegaLiteLoaded = $state(false);
  let element: HTMLElement;
  let chart: any;
  const baseURL = getVendorsCDN();

  async function onVegaEmbedLoaded() {
    await tick(); // Wait for vega to be loaded
    if (element) {
      const specs = $state.snapshot(data.vega_lite_obj); // Vega does not expect proxy objects
      chart = await window.vegaEmbed(element, specs, {
        width: 400,
        height: 300,
        ast: true,
        actions: false,
      });
    }
  }

  onDestroy(() => {
    chart?.finalize();
  });
</script>

<svelte:head>
  <script
    src={`${baseURL}/vega-6.2.0.js`}
    onload={() => (vegaLoaded = true)}></script>
  <script
    src={`${baseURL}/vega-embed-7.1.0.js`}
    onload={() => (vegaLiteLoaded = true)}></script>
  <script
    src={`${baseURL}/vega-lite-6.4.2.js`}
    onload={() => onVegaEmbedLoaded()}></script>
</svelte:head>

<div
  class="sw-vega-chart"
  bind:this={element}>
</div>

<style src="./VegaChart.css"></style>
