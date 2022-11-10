<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Classification } from '@nuclia/core';
  import { map } from 'rxjs';
  import { labelSets } from '../../core/stores/labels.store';
  import { tap } from 'rxjs/operators';
  import IconButton from '../button/IconButton.svelte';

  export let label: Classification;
  export let clickable = false;
  export let removable = false;

  let setColor = true;
  const color = labelSets.pipe(
    map((labelSet) => labelSet[label.labelset]?.color),
    tap((color: string) => {
      // When label color is #CCCED6, the CSS filter applied renders the text as bluish instead of black, so we keep the default dark color instead.
      if (color === '#CCCED6') {
        setColor = false;
      }
      return color;
    }),
  );

  const dispatch = createEventDispatcher();
  const remove = () => {
    dispatch('remove');
  };
  const onClick = (event: MouseEvent | KeyboardEvent) => {
    if (clickable) {
      event.preventDefault();
      event.stopPropagation();
      dispatch('click');
    }
  };
</script>

<div
  class="sw-label"
  class:closeable={removable}
  style:background-color={$color}
  on:click={onClick}>
  <span
    style:color={setColor ? $color : ''}
    class:clickable>
    {label.label}
  </span>
  {#if removable}
    <IconButton
      icon="cross"
      ariaLabel="Delete"
      aspect="basic"
      size="small"
      on:click={remove} />
  {/if}
</div>

<style
  lang="scss"
  src="./Label.scss"></style>
