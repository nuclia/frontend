<script lang="ts">
  import type { Classification } from '@nuclia/core';
  import { map } from 'rxjs';
  import { labelSets } from '../../core/stores/labels.store';
  import Chip from '../chip/Chip.svelte';

  export let label: Classification;
  export let clickable = false;
  export let removable = false;

  const color = labelSets.pipe(map((labelSet) => labelSet[label.labelset]?.color));
  const title = labelSets.pipe(map((labelSets) => labelSets[label.labelset]?.title));
</script>

<Chip
  color={$color}
  {clickable}
  {removable}
  on:click
  on:remove>
  {label.label || $title}
</Chip>
