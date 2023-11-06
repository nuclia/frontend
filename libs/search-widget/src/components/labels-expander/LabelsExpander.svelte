<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { combineLatest, map, Observable, take } from 'rxjs';
  import type { LabelSetWithId } from '../../core';
  import {
    _,
    addLabelSetFilter,
    labelFilters,
    labelSetFilters,
    creationEnd,
    creationStart,
    filterByCreatedDate,
    hasRangeCreation,
    removeLabelFilter,
    removeLabelSetFilter,
  } from '../../core';
  import IconButton from '../../common/button/IconButton.svelte';
  import Checkbox from '../../common/checkbox/Checkbox.svelte';

  export let labelSets: LabelSetWithId[] = [];
  export let selectedLabels: string[] = [];

  const dispatch = createEventDispatcher();
  let expanders: { [id: string]: boolean } = {};
  const selectedLabelSets: Observable<string[]> = labelSetFilters.pipe(
    map((filters) => filters.map((filter) => filter.id)),
  );

  function selectLabelSet(labelSet, selected)  {
    if (selected) {
      labelSet.labels.forEach((label) => removeLabelFilter({ labelset: labelSet.id, label: label.title}));
      addLabelSetFilter(labelSet.id, labelSet.kind)
    }
    else {
      removeLabelSetFilter(labelSet.id);
    }
  }

  function toggleExpander(id) {
    expanders[id] = !expanders[id];
  }

  onMount(() => {
    combineLatest([labelFilters, hasRangeCreation]).pipe(take(1)).subscribe(([filters, hasRangeCreation]) => {
      expanders = filters.map((filter) => filter.classification.labelset).reduce(
        (acc, curr) => ({ ...acc, [curr]: true }),
        {},
      );
      expanders['created'] = hasRangeCreation;
    });
  })

</script>

<div class="sw-labels-expander">
  {#if $filterByCreatedDate}
    <div
      class="header"
      class:expended={expanders['created']}>
      <div class="header-content">{$_('input.date_created')}</div>
      <span class="header-button">
          <IconButton
            on:click={() => toggleExpander('created')}
            icon="chevron-down"
            size="small"
            aspect="basic" />
        </span>
    </div>
    {#if expanders['created']}
      <div class="expander-content">
        <div>
          <label for="range-creation-start">{$_('input.from')}</label>
          <div>
            <input
              id="range-creation-start"
              type="date"
              value={$creationStart}
              on:change={(e) => creationStart.set(e.target.value || undefined)} />
          </div>
        </div>
        <div>
          <label for="range-creation-end">{$_('input.to')}</label>
          <div>
            <input
              id="range-creation-end"
              type="date"
              value={$creationEnd}
              on:change={(e) => creationEnd.set(e.target.value || undefined)}
            />
          </div>
        </div>
      </div>
    {/if}
  {/if}
  {#each labelSets as labelSet}
    <div
      class="header"
      class:expended={expanders[labelSet.id]}>
      <div class="header-content">
        <Checkbox
          checked={$selectedLabelSets.includes(labelSet.id)}
          on:change={(event) => selectLabelSet(labelSet, event.detail)}>
          {labelSet.title}
        </Checkbox>
      </div>
      <span class="header-button">
        <IconButton
          on:click={() => toggleExpander(labelSet.id)}
          icon="chevron-down"
          size="small"
          aspect="basic" />
      </span>
    </div>
    {#if expanders[labelSet.id]}
      <div class="expander-content labels">
        {#each labelSet.labels as label}
          <div>
            <Checkbox
              checked={selectedLabels.includes(label.title)}
              disabled={$selectedLabelSets.includes(labelSet.id)}
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
