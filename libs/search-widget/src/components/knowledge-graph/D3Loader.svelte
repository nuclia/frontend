<script lang="ts">
  import KnowledgeGraph from './KnowledgeGraph.svelte';
  import { createEventDispatcher } from 'svelte';

  let { rightPanelOpen } = $props();

  const dispatch = createEventDispatcher();
  let isLoaded = $state(false);

  function onD3Loaded() {
    isLoaded = true;
  }
</script>

<svelte:head>
  <script
    src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.0.0/d3.min.js"
    onload={() => onD3Loaded()}></script>
</svelte:head>

{#if isLoaded}
  <KnowledgeGraph
    {rightPanelOpen}
    on:openRightPanel />
{/if}
