<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { map, Observable, take } from 'rxjs';
  import type { LabelSetWithId } from '../../core';
  import { addLabelSetFilter, labelFilters, labelSetFilters, removeLabelSetFilter } from '../../core';
  import IconButton from '../../common/button/IconButton.svelte';
  import Checkbox from '../../common/checkbox/Checkbox.svelte';

  export let labelSets: LabelSetWithId[] = [];
  export let selectedLabels: string[] = [];

  const dispatch = createEventDispatcher();
  let expandedLabelSets: { [id: string]: boolean } = {};
  const selectedLabelSets: Observable<string[]> = labelSetFilters.pipe(
    map((filters) => filters.map((filter) => filter.id)),
  );

  function selectLabelSet(labelSet, selected)  {
    selected  ? addLabelSetFilter(labelSet.id, labelSet.kind) : removeLabelSetFilter(labelSet.id);
  }

  function toggleLabelSet(labelSetId) {
    expandedLabelSets[labelSetId] = !expandedLabelSets[labelSetId];
  }

  onMount(() => {
    labelFilters.pipe(take(1)).subscribe((filters) => {
      expandedLabelSets = filters.map((filter) => filter.classification.labelset).reduce(
        (acc, curr) => ({ ...acc, [curr]: true }),
        {},
      );
    });
  })

</script>

<div class="sw-labels-expander">
  {#each labelSets as labelSet}
    <div
      class="header"
      class:expended={expandedLabelSets[labelSet.id]}>
      <Checkbox
        checked={$selectedLabelSets.includes(labelSet.id)}
        on:change={(event) => selectLabelSet(labelSet, event.detail)}>
        {labelSet.title}
      </Checkbox>
      <span class="expander-icon">
        <IconButton
          on:click={() => toggleLabelSet(labelSet.id)}
          icon="chevron-down"
          size="small"
          aspect="basic" />
      </span>
    </div>
    {#if expandedLabelSets[labelSet.id]}
      <div class="labels">
        {#each labelSet.labels as label}
          <div>
            <Checkbox
              checked={selectedLabels.includes(label.title)}
              on:change={(event) => dispatch('labelSelect', { labelSet, label, selected: event.detail })}>
              {label.title}
            </Checkbox>
          </div>
        {/each}
      </div>
    {/if}
  {/each}
</div>

<style
  lang="scss"
  src="./LabelsExpander.scss"></style>
