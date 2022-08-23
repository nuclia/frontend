<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getCDN } from '../../core/utils';
  import { nucliaState } from '../../core/store';
  import type { Classification }  from '@nuclia/core';
  import { map } from 'rxjs';

  export let label: Classification;
  export let removable = false;

  const color = nucliaState().labels.pipe(map((labels) => {
    return Object.entries(labels).find(([key]) => key === label.labelset)?.[1].color;
  }));

  const dispatch = createEventDispatcher();
  const remove = () => {
    dispatch('remove');
  };
</script>

<div class="label" style:background-color={$color} style:color={$color}>
  <span>{label.label}</span>
  {#if removable}
    <img on:click={remove} src={`${getCDN()}icons/circle-cross.svg`} alt="delete">
  {/if}
</div>

<style>
  .label {
    display: inline-flex;
    padding: 0 0.5em;
    font-size: 0.75em;
    line-height: 1.25;
    white-space: nowrap;
    border-radius: 1px;
    max-width: 100%;
    box-sizing: border-box;
  }
  span {
    flex: 1 1 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    filter: saturate(100) brightness(80%);
  }
  img {
    flex: 0 0 auto;
    margin-left: 0.5em;
    width: 14px;
    cursor: pointer;
  }
</style>
