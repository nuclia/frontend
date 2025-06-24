<script lang="ts">
  import KnowledgeGraph from './KnowledgeGraph.svelte';

  let { rightPanelOpen } = $props();
  let isLoaded = $state(false);
  function onD3Loaded() {
    isLoaded = true;
  }
</script>

<svelte:head>
  <script
    src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"
    onload={() => onD3Loaded()}></script>
</svelte:head>

{#if isLoaded}
  <KnowledgeGraph
    {rightPanelOpen}
    on:openRightPanel />
{/if}
