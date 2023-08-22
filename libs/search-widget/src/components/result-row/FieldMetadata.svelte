<script lang="ts">
  import type { TypedResult } from '../../core';
  import { getDataKeyFromFieldType } from '@nuclia/core';
  import { IconButton } from '../../common';
  import { formatSize } from '../../core';

  export let result: TypedResult;

  const excludedMetadata = ['filename', 'body'];
  let metadataList: { label: string; value: string; }[] = [];
  $: {
    const fieldId = result.field;
    if (fieldId) {
      const keyFromFieldType = result.field && getDataKeyFromFieldType(result.field.field_type);
      if (keyFromFieldType) {
        const data = result.data?.[keyFromFieldType]?.[fieldId.field_id]?.value || {};
        metadataList = Object.entries(data).filter(([key, value]) => !excludedMetadata.includes(key) && !!value).reduce((list, [key, value]) => {
          if (typeof value === 'object') {
            Object.entries(value).filter(([subKey, subValue]) => {
              if (subKey === 'uri') {
                return !(subValue as string).startsWith('/kb');
              }
              return !excludedMetadata.includes(subKey) && !!subValue;
            }).forEach(([subKey, subValue]) => {
              list.push({ label: subKey, value: subKey === 'size' ? formatSize(subValue as number) : `${subValue}` });
            });
          } else {
            list.push({ label: key, value: key === 'added' ? value.substring(0, value.indexOf('T')) : value });
          }
          return list;
        }, [] as { label: string; value: string; }[]);
      }
    }
  }

  let lineCount = 2;
  let expanded = false;
  let metadataElements: HTMLElement[] = [];
  $: lastMetadata = metadataElements[metadataElements.length - 1];
  $: hasMoreMetadata = !!lastMetadata && lastMetadata.offsetTop > 1;
  $: expanderLeft = getExpanderLeftPosition(metadataElements);

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
    if (expanded) {
      // on mobile metadata can be on several lines, so to make a simple calculation we consider we can display 2 items per line
      lineCount = metadataElements.reduce((count, element) => {
        if (element.offsetTop > 0) {
          count = count + 1;
        }
        return count;
      }, 1) / 2;
    }
  }

  function onResize() {
    hasMoreMetadata = !!lastMetadata && lastMetadata.offsetTop > 1;
    expanderLeft = getExpanderLeftPosition(metadataElements);
  }
</script>

<svelte:window on:resize={onResize}></svelte:window>

{#if metadataList.length > 0}
  <div class="sw-field-metadata"
       class:expanded
       style:--line-count={lineCount}>
    <div class="metadata-container ellipsis"
         on:click={expandMetadata}
         on:keyup={(e) => {if (e.key === 'Enter') expandMetadata();}}>
      {#each metadataList as metadata, i}
        <div bind:this={metadataElements[i]}>
          <span class="body-s">{metadata.label}:</span>
          <span class="title-xxs">{metadata.value}</span>
        </div>
      {/each}
    </div>
    {#if hasMoreMetadata}
      <div class="expander-container" style:left="{expanderLeft}px">
        <IconButton size="xsmall"
                    icon="chevron-down"
                    aspect="basic"
                    on:click={expandMetadata}
        ></IconButton>
      </div>
    {/if}
  </div>
{/if}


<style
  lang="scss"
  src="./FieldMetadata.scss"></style>
