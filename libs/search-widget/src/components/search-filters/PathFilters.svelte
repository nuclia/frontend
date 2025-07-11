<script lang="ts">
  import Self from './PathFilters.svelte';
  import IconButton from '../../common/button/IconButton.svelte';
  import Checkbox from '../../common/checkbox/Checkbox.svelte';
  import { loadPaths, pathFilter, type PathTree } from '../../core';

  interface Props {
    paths: PathTree;
    root?: boolean;
  }
  let { paths, root = false }: Props = $props();
</script>

<div
  class="sw-path-filters"
  class:indent={!root}>
  {#each Object.values(paths) as node}
    <div class="node">
      <div class="checkbox">
        <Checkbox
          checked={$pathFilter === node.path}
          on:change={(event) => pathFilter.set(event.detail ? node.path : undefined)}>
          {node.label}
          {#if node.count > 0}
            ({node.count})
          {/if}
        </Checkbox>
      </div>
      {#if node.count > 0 && Object.keys(node.children).length === 0}
        <IconButton
          aspect="basic"
          icon="chevron-down"
          size="xsmall"
          on:click={() => loadPaths(node.childrenPaths).subscribe()}></IconButton>
      {/if}
    </div>
    {#if Object.keys(node.children).length > 0}
      <Self paths={node.children} />
    {/if}
  {/each}
</div>

<style src="./PathFilters.css"></style>
