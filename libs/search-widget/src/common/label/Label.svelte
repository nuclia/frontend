<script lang="ts">
  import type { Classification } from '@nuclia/core';
  import { map } from 'rxjs';
  import { labelSets } from '../../core/stores/labels.store';
  import { tap } from 'rxjs/operators';
  import Chip from '../chip/Chip.svelte';

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
</script>

<Chip
  color={$color}
  {clickable}
  {removable}
  on:click
  on:remove>
  {label.label}
</Chip>
