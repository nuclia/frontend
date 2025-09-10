<script lang="ts">
  import { onMount } from 'svelte';
  import { IconButton } from '../../common';
  import type { TypedResult } from '../../core';
  import { formatDate, formatSize } from '../../core';

  interface Props {
    result: TypedResult;
  }

  let { result }: Props = $props();

  let expanded = $state(false);
  let containerWidth = $state(0);
  let metadataElements: HTMLElement[] = $state([]);
  let expanderLeft = $state(0);
  let hasMoreMetadata = $state(false);
  let lastMetadata = $derived(metadataElements[metadataElements.length - 1]);

  function getExpanderLeftPosition(elements: HTMLElement[]) {
    const left = elements.reduce((left, element) => {
      // update left when the element is visible on the first line (line height is 22px)
      if (element.offsetTop < 22) {
        left = element.offsetLeft + element.offsetWidth + 8;
      }
      return left;
    }, 0);
    return left;
  }

  function expandMetadata() {
    expanded = !expanded;
  }

  function updateMetadataExpander() {
    hasMoreMetadata = !!lastMetadata && lastMetadata.offsetTop > 1;
    expanderLeft = getExpanderLeftPosition(metadataElements);
  }

  $effect(() => {
    // Update metadata expander position when container width changes
    // It's better than listening to window resize because window event isn't triggered when we resize divs internally (like resizing a right panel for example)
    containerWidth;
    updateMetadataExpander();
  });

  onMount(() => {
    setTimeout(() => {
      // wait for elements to be properly mounted before computed metadata expander position
      updateMetadataExpander();
    }, 0);
  });
</script>

{#if result.resultMetadata && result.resultMetadata.length > 0}
  <div
    class="sw-field-metadata"
    class:expanded
    bind:offsetWidth={containerWidth}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="metadata-container"
      class:ellipsis={!expanded}
      onclick={expandMetadata}
      onkeyup={(e) => {
        if (e.key === 'Enter') expandMetadata();
      }}>
      {#each result.resultMetadata as metadata, i}
        <div bind:this={metadataElements[i]}>
          {#if metadata.title !== 'NO_TITLE'}
            <span class="body-s">{metadata.title || metadata.label}:</span>
          {/if}
          <span class="title-xxs">
            {#if metadata.type === 'date'}
              {formatDate(metadata.value as string)}
            {:else if metadata.label === 'size'}
              {formatSize(metadata.value as number)}
            {:else if metadata.type === 'list'}
              {(metadata.value as string[]).join(', ')}
            {:else}
              {metadata.value}
            {/if}
          </span>
        </div>
      {/each}
    </div>
    {#if hasMoreMetadata}
      <div
        class="expander-container"
        style:left="{expanderLeft}px">
        <IconButton
          size="xsmall"
          icon="chevron-down"
          aspect="basic"
          on:click={expandMetadata}></IconButton>
      </div>
    {/if}
  </div>
{/if}

<style src="./FieldMetadata.css"></style>
