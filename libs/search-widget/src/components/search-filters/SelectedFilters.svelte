<script lang="ts">
  import { PATH_FILTER_PREFIX, type Classification } from '@nuclia/core';
  import type { Observable } from 'rxjs';
  import { combineLatest, map } from 'rxjs';
  import { createEventDispatcher } from 'svelte';
  import Chip from '../../common/chip/Chip.svelte';
  import Label from '../../common/label/Label.svelte';
  import {
    _,
    creationEnd,
    creationStart,
    entities,
    entitiesDefaultColor,
    entityFilters,
    labelFilters,
    labelSetFilters,
    mimeTypesfilters,
    pathFilter,
    rangeCreation,
    removeEntityFilter,
    removeLabelFilter,
    removeLabelSetFilter,
    removeMimeFilter,
    type EntityFilter,
  } from '../../core';

  interface SelectedFilter {
    type: 'label' | 'labelset' | 'entity' | 'creation-start' | 'creation-end' | 'mimetype' | 'path';
    key: string;
    value: Classification | EntityFilter | string;
  }

  const dispatch = createEventDispatcher();

  const filters: Observable<SelectedFilter[]> = combineLatest([
    rangeCreation,
    labelFilters,
    labelSetFilters,
    entityFilters,
    mimeTypesfilters,
    pathFilter,
  ]).pipe(
    map(([rangeCreation, labels, labelSets, entities, mimeTypesfilters, pathFilter]) => [
      ...Object.entries(rangeCreation)
        .filter(([, value]) => !!value)
        .map(([key, value]) => ({
          type: `creation-${key}`,
          key,
          value: new Intl.DateTimeFormat(navigator.language, { timeZone: 'UTC' }).format(new Date(value)),
        })),
      ...labels.map((value) => ({
        type: 'label',
        key: value.classification.label + value.classification.labelset,
        value: value.classification,
      })),
      ...labelSets.map((value) => ({
        type: 'labelset',
        key: `labelset-${value.id}`,
        value: value.id,
      })),
      ...entities.map((value) => ({
        type: 'entity',
        key: value.family + value.entity,
        value,
      })),
      ...mimeTypesfilters.map((value) => ({
        type: 'mimetype',
        key: value.key,
        value: value.label,
      })),
      ...(pathFilter ? [pathFilter] : []).map((path) => ({
        type: 'path',
        key: path,
        value: path.split(PATH_FILTER_PREFIX)[1],
      })),
    ]),
  );

  const removeFilter = (filter: SelectedFilter) => {
    if (filter.type === 'creation-start') {
      creationStart.set(undefined);
    } else if (filter.type === 'creation-end') {
      creationEnd.set(undefined);
    } else if (filter.type === 'label') {
      removeLabelFilter(filter.value as Classification);
    } else if (filter.type === 'labelset') {
      removeLabelSetFilter(filter.value as string);
    } else if (filter.type === 'entity') {
      removeEntityFilter(filter.value as EntityFilter);
    } else if (filter.type === 'mimetype') {
      removeMimeFilter(filter.key);
    } else if (filter.type === 'path') {
      pathFilter.set(undefined);
    }
    dispatch('remove');
  };
</script>

<div class="sw-selected-filters">
  {#each $filters as filter (filter.key)}
    {#if filter.type === 'creation-start'}
      <Chip
        removable
        color={entitiesDefaultColor}
        on:remove={() => removeFilter(filter)}>
        {$_('input.from')}
        {filter.value}
      </Chip>
    {/if}
    {#if filter.type === 'creation-end'}
      <Chip
        removable
        color={entitiesDefaultColor}
        on:remove={() => removeFilter(filter)}>
        {$_('input.to')}
        {filter.value}
      </Chip>
    {/if}
    {#if filter.type === 'label'}
      <Label
        label={filter.value}
        removable
        on:remove={() => removeFilter(filter)} />
    {/if}
    {#if filter.type === 'labelset'}
      <Label
        label={{ labelset: filter.value, label: '' }}
        removable
        on:remove={() => removeFilter(filter)} />
    {/if}
    {#if filter.type === 'entity'}
      <Chip
        removable
        color={$entities.find((family) => family.id === filter.value.family)?.color || entitiesDefaultColor}
        on:remove={() => removeFilter(filter)}>
        {filter.value.entity}
      </Chip>
    {/if}
    {#if filter.type === 'mimetype' || filter.type === 'path'}
      <Chip
        removable
        color={entitiesDefaultColor}
        on:remove={() => removeFilter(filter)}>
        {filter.value}
      </Chip>
    {/if}
  {/each}
</div>

<style src="./SelectedFilters.css"></style>
