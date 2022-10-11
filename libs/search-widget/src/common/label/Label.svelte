<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Classification } from '@nuclia/core';
  import { map } from 'rxjs';
  import { labelSets } from '../../core/stores/labels.store';
  import Icon from '../icons/Icon.svelte';
  import { tap } from 'rxjs/operators';

  export let label: Classification;
  export let clickable = false;
  export let removable = false;

  let setColor = true;
  const color = labelSets.pipe(
    map((labelSet) => labelSet[label.labelset]?.color),
    tap((color: string) => {
      if (color === '#CCCED6') {
        setColor = false;
      }
      return color;
    })
  );


  const dispatch = createEventDispatcher();
  const remove = () => {
    dispatch('remove');
  };
  const onClick = (event: MouseEvent | KeyboardEvent) => {
    if (clickable) {
      event.preventDefault();
      event.stopPropagation();
      dispatch('selected');
    }
  }
</script>

<div class="sw-label" style:background-color={$color}>
  <span style:color={setColor ? $color : ''}
        class:clickable
        on:click={onClick}>{label.label}</span>
  {#if removable}
    <div class="close-icon"
         aria-label="Delete"
         on:click={remove}>
      <Icon name="circle-cross" size="small"/>
    </div>
  {/if}
</div>

<style lang="scss" src="./Label.scss"></style>
