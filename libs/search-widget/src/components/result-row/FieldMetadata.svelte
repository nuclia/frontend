<script lang="ts">
  import type { TypedResult } from '../../core';
  import { IconButton } from '../../common';
  import { formatSize, formatDate } from '../../core';

  interface Props {
    result: TypedResult;
  }

  let { result }: Props = $props();

  let expanded = $state(false);
  let metadataElements: HTMLElement[] = $state([]);

  function getExpanderLeftPosition(elements: HTMLElement[]) {
    return elements.reduce((left, element) => {
      if (element.offsetTop === 0) {
        left = element.offsetLeft + element.offsetWidth + 8;
      }
      return left;
    }, 0);
  }

  function expandMetadata() {
    expanded = !expanded;
  }

  function onResize() {
    hasMoreMetadata = !!lastMetadata && lastMetadata.offsetTop > 1;
    expanderLeft = getExpanderLeftPosition(metadataElements);
  }
  let lastMetadata = $derived(metadataElements[metadataElements.length - 1]);
  let hasMoreMetadata = $derived(!!lastMetadata && lastMetadata.offsetTop > 1);
  let expanderLeft = $derived(getExpanderLeftPosition(metadataElements));
</script>

<svelte:window onresize={onResize} />

{#if result.resultMetadata && result.resultMetadata.length > 0}
  <div
    class="sw-field-metadata"
    class:expanded>
    <div
      class="metadata-container"
      class:ellipsis={!expanded}
      onclick={expandMetadata}
      onkeyup={(e) => {
        if (e.key === 'Enter') expandMetadata();
      }}>
      {#each result.resultMetadata as metadata, i}
        <div bind:this={metadataElements[i]}>
          <span class="body-s">{metadata.label}:</span>
          <span class="title-xxs">
            {#if metadata.type === 'date'}
              {formatDate(metadata.value)}
            {:else if metadata.label === 'size'}
              {formatSize(metadata.value)}
            {:else if metadata.type === 'list'}
              {metadata.value.map((item) => item.label).join(', ')}
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

<style
  lang="scss"
  src="./FieldMetadata.scss"></style>
