<script lang="ts">
import KnowledgeGraph from './KnowledgeGraph.svelte';
import { createEventDispatcher } from 'svelte';

export let rightPanelOpen;

const dispatch = createEventDispatcher();
let isLoaded = false;

function onD3Loaded() {
  isLoaded = true;
}
</script>

<svelte:head>
  <script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.0.0/d3.min.js" on:load={() => onD3Loaded()}></script>
</svelte:head>

{#if isLoaded}
  <KnowledgeGraph
    {rightPanelOpen}
    on:openRightPanel />
{/if}
