<script lang="ts">
  import type { Classification } from '@nuclia/core';
  import { map } from 'rxjs';
  import { labelSets } from '../../core/stores/labels.store';
  import Chip from '../chip/Chip.svelte';

  interface Props {
    label: Classification;
    clickable?: boolean;
    removable?: boolean;
  }

  let { label, clickable = false, removable = false }: Props = $props();

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
