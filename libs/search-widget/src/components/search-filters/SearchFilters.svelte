<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { combineLatest, map, Observable, take } from 'rxjs';
  import { type EntityGroup, filterByLabels, type LabelSetWithId, refreshFamily } from '../../core';
  import {
    _,
    addEntityFilter,
    addLabelFilter,
    addLabelSetFilter,
    creationEnd,
    creationStart,
    entities,
    entityFilters,
    filterByCreatedDate,
    filterByLabelFamilies,
    hasRangeCreation,
    labelFilters,
    labelSetFilters,
    orderedLabelSetList,
    preselectedFilters,
    removeEntityFilter,
    removeLabelFilter,
    removeLabelSetFilter,
    searchFilters,
  } from '../../core';
  import IconButton from '../../common/button/IconButton.svelte';
  import Checkbox from '../../common/checkbox/Checkbox.svelte';
  import type { Label } from '@nuclia/core';
  import { getFilterFromEntity, getFilterFromLabel } from '@nuclia/core';

  const labelSets: Observable<LabelSetWithId[]> = orderedLabelSetList;
  const preselection: Observable<string[]> = preselectedFilters;
  const dispatch = createEventDispatcher();

  const selectedLabelSets: Observable<string[]> = combineLatest([
    labelSetFilters,
    preselection
  ])
    .pipe(
      map(([filters, preselection]) => filters.map((filter) => filter.id).concat(preselection))
    );
  const selectedLabels: Observable<string[]> = combineLatest([
    labelFilters,
    preselection
  ])
    .pipe(
      map(([filters, preselection]) => filters.map((filter) => getFilterFromLabel(filter.classification)).concat(preselection))
    );
  const selectedEntities: Observable<string[]> = combineLatest([
    entityFilters,
    preselection
  ])
    .pipe(
      map(([filters, preselection]) => filters.map((filter) => getFilterFromEntity(filter)).concat(preselection))
    );
  let expanders: { [id: string]: boolean } = {};

  function selectLabelSet(labelSet: LabelSetWithId, selected: boolean) {
    if (selected) {
      labelSet.labels.forEach((label) => removeLabelFilter({ labelset: labelSet.id, label: label.title }));
      addLabelSetFilter(labelSet.id, labelSet.kind);
    } else {
      removeLabelSetFilter(labelSet.id);
    }
  }

  function toggleExpander(id: string) {
    expanders[id] = !expanders[id];
  }

  function toggleEntitiesExpander(familyId: string) {
    if (!entities.getValue().find((family) => family.id === familyId)?.entities) {
      refreshFamily(familyId);
    }
    toggleExpander(familyId);
  }

  function selectLabel(labelSet: LabelSetWithId, label: Label, selected: boolean) {
    const classification = { labelset: labelSet.id, label: label.title };
    selected ? addLabelFilter(classification, labelSet.kind) : removeLabelFilter(classification);
  }

  function selectEntity(family: EntityGroup, entity: string, selected: boolean) {
    const filter = { family: family.id, entity };
    selected ? addEntityFilter(filter) : removeEntityFilter(filter);
  }

  function onClickLabelExpander(id: string, event: Event) {
    if ((event?.target as HTMLElement).tagName === 'DIV') {
      toggleExpander(id);
    }
  }

  onMount(() => {
    combineLatest([labelFilters, hasRangeCreation]).pipe(take(1)).subscribe(([filters, hasRangeCreation]) => {
      expanders = filters.map((filter) => filter.classification.labelset).reduce(
        (acc, curr) => ({ ...acc, [curr]: true }),
        {}
      );
      expanders['created'] = hasRangeCreation;
    });
    const initialFilters =  searchFilters.getValue();
    const initialCreation = `${creationStart.getValue()}${creationEnd.getValue()}`;
    return () => {
      if (
        JSON.stringify(initialFilters) !== JSON.stringify(searchFilters.getValue()) ||
        initialCreation !== `${creationStart.getValue()}${creationEnd.getValue()}`
      ) {
        dispatch('search');
      }
    };
  });

</script>

<div class="sw-search-filters">
  {#if $filterByCreatedDate}
    <div
      class="header"
      class:expanded={expanders['created']}>
      <div
        class="header-content"
        on:click={() => toggleExpander('created')}>
        <span>
          {$_('input.date_created')}
        </span>
      </div>
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
  {#each $labelSets as labelSet}
    <div
      class="header"
      class:expanded={expanders[labelSet.id]}>
      <div
        class="header-content"
        class:not-expandable={!$filterByLabels && $filterByLabelFamilies}
        on:click={(event) => ($filterByLabels ? onClickLabelExpander(labelSet.id, event) : undefined)}>
        {#if $filterByLabelFamilies}
          <Checkbox
            checked={$selectedLabelSets.includes(labelSet.id)}
            disabled={$preselection.includes(labelSet.id)}
            on:change={(event) => selectLabelSet(labelSet, event.detail)}>
            {labelSet.title}
          </Checkbox>
        {:else}
          <span title="{labelSet.title}">{labelSet.title}</span>
        {/if}
      </div>
      {#if $filterByLabels}
        <span class="header-button">
          <IconButton
            on:click={() => toggleExpander(labelSet.id)}
            icon="chevron-down"
            size="small"
            aspect="basic" />
        </span>
      {/if}
    </div>
    {#if $filterByLabels && expanders[labelSet.id]}
      <div
        class="expander-content"
        class:indented={$filterByLabelFamilies}>
        {#each labelSet.labels as label}
          <div>
            <Checkbox
              checked={$selectedLabels.includes(getFilterFromLabel({ labelset: labelSet.id, label: label.title })) || $selectedLabelSets.includes(labelSet.id)}
              disabled={$selectedLabelSets.includes(labelSet.id) || $preselection.includes(getFilterFromLabel({labelset: labelSet.id, label: label.title}))}
              on:change={(event) => selectLabel(labelSet, label, event.detail)}>
              {label.title}
            </Checkbox>
          </div>
        {/each}
      </div>
    {/if}
  {/each}
  {#each $entities as family}
    <div
      class="header"
      class:expanded={expanders[family.id]}>
      <div class="header-content" on:click={() => toggleEntitiesExpander(family.id)}>
        <span title="{family.title}">
          {family.title}
        </span>
      </div>
      <span class="header-button">
        <IconButton
          on:click={() => toggleEntitiesExpander(family.id)}
          icon="chevron-down"
          size="small"
          aspect="basic" />
      </span>
    </div>
    {#if expanders[family.id]}
      <div class="expander-content">
        {#each family.entities || [] as entity}
          <div>
            <Checkbox
              checked={$selectedEntities.includes(getFilterFromEntity({family: family.id, entity: entity}))}
              on:change={(event) => selectEntity(family, entity, event.detail)}>
              {entity}
            </Checkbox>
          </div>
        {/each}
      </div>
    {/if}
  {/each}
</div>

<style
  lang="scss"
  src="./SearchFilters.scss"></style>
