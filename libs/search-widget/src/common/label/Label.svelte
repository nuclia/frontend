<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getCDN } from '../../core/utils';
  import type { Classification } from '@nuclia/core';
  import { map } from 'rxjs';
  import { labelSets } from '../../core/stores/labels.store';

  export let label: Classification;
  export let removable = false;

  const color = labelSets.pipe(
    map((labelSet) => labelSet[label.labelset]?.color),
  );

  const dispatch = createEventDispatcher();
  const remove = () => {
    dispatch('remove');
  };
</script>

<div class="sw-label" style:background-color={$color} style:color={$color}>
  <span>{label.label}</span>
  {#if removable}
    <img on:click={remove} src={`${getCDN()}icons/circle-cross.svg`} alt="delete" />
  {/if}
</div>

<style lang="scss" src="./Label.scss"></style>
