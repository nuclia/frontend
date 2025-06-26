<script lang="ts">
  import type { Label } from '@nuclia/core';
  import { getFilterFromEntity, getFilterFromLabel } from '@nuclia/core';
  import { combineLatest, map, Observable, take } from 'rxjs';
  import { createEventDispatcher, onMount } from 'svelte';
  import IconButton from '../../common/button/IconButton.svelte';
  import Checkbox from '../../common/checkbox/Checkbox.svelte';
  import {
    _,
    addEntityFilter,
    addLabelFilter,
    addLabelSetFilter,
    addMimeFilter,
    creationEnd,
    creationStart,
    entities,
    entityFilters,
    type EntityGroup,
    filterByCreatedDate,
    filterByLabelFamilies,
    filterByLabels,
    filterByMime,
    hasRangeCreation,
    labelFilters,
    labelSetFilters,
    type LabelSetWithId,
    type MimeFacet,
    mimeTypesfilters,
    orderedLabelSetList,
    orderedMimeFacetsList,
    preselectedFilters,
    refreshFamily,
    removeEntityFilter,
    removeLabelFilter,
    removeLabelSetFilter,
    removeMimeFilter,
    searchFilters,
  } from '../../core';

  const labelSets: Observable<LabelSetWithId[]> = orderedLabelSetList;
  const mimeFacets: Observable<MimeFacet[]> = orderedMimeFacetsList;
  const preselection: Observable<string[]> = preselectedFilters;
  const dispatch = createEventDispatcher();

  const selectedLabelSets: Observable<string[]> = combineLatest([labelSetFilters, preselection]).pipe(
    map(([filters, preselection]) => filters.map((filter) => filter.id).concat(preselection)),
  );
  const selectedLabels: Observable<string[]> = combineLatest([labelFilters, preselection]).pipe(
    map(([filters, preselection]) =>
      filters.map((filter) => getFilterFromLabel(filter.classification)).concat(preselection),
    ),
  );
  const selectedEntities: Observable<string[]> = combineLatest([entityFilters, preselection]).pipe(
    map(([filters, preselection]) => filters.map((filter) => getFilterFromEntity(filter)).concat(preselection)),
  );
  const selectedMimeTypes: Observable<string[]> = combineLatest([mimeTypesfilters, preselection]).pipe(
    map(([filters, preselection]) => filters.map((filter) => filter.key).concat(preselection)),
  );
  let expanders: { [id: string]: boolean } = $state({});

  function selectLabelSet(labelSet: LabelSetWithId, selected: boolean) {
    if (selected) {
      labelSet.labels.forEach((label) => removeLabelFilter({ labelset: labelSet.id, label: label.title }));
      addLabelSetFilter(labelSet.id, labelSet.kind);
    } else {
      removeLabelSetFilter(labelSet.id);
    }
  }

  function selectMimeTypes(mimeFacet: MimeFacet, selected: boolean) {
    if (selected) {
      addMimeFilter(mimeFacet);
    } else {
      removeMimeFilter(mimeFacet.facet.key);
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
    combineLatest([labelFilters, hasRangeCreation])
      .pipe(take(1))
      .subscribe(([filters, hasRangeCreation]) => {
        expanders = filters
          .map((filter) => filter.classification.labelset)
          .reduce((acc, curr) => ({ ...acc, [curr]: true }), {});
        expanders['created'] = hasRangeCreation;
      });
    const initialFilters = searchFilters.getValue();
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
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="header-content"
        onclick={() => toggleExpander('created')}>
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
              onchange={(e) => creationStart.set((e.target as HTMLInputElement)?.value || undefined)} />
          </div>
        </div>
        <div>
          <label for="range-creation-end">{$_('input.to')}</label>
          <div>
            <input
              id="range-creation-end"
              type="date"
              value={$creationEnd}
              onchange={(e) => creationEnd.set((e.target as HTMLInputElement)?.value || undefined)} />
          </div>
        </div>
      </div>
    {/if}
  {/if}
  {#if $filterByMime}
    <div
      class="header"
      class:expanded={expanders['mime']}>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="header-content"
        onclick={() => toggleExpander('mime')}>
        <span>
          {$_('input.mime_types')}
        </span>
      </div>
      <span class="header-button">
        <IconButton
          on:click={() => toggleExpander('mime')}
          icon="chevron-down"
          size="small"
          aspect="basic" />
      </span>
    </div>
    {#if expanders['mime']}
      <div class="expander-content">
        {#each $mimeFacets as mimeFacet}
          <div>
            <Checkbox
              checked={$selectedMimeTypes.includes(mimeFacet.facet.key)}
              disabled={$preselection.includes(mimeFacet.facet.key)}
              on:change={(event) => selectMimeTypes(mimeFacet, event.detail)}>
              {mimeFacet.label} ({mimeFacet.facet.count})
            </Checkbox>
          </div>
        {/each}
      </div>
    {/if}
  {/if}
  {#each $labelSets as labelSet}
    <div
      class="header"
      class:expanded={expanders[labelSet.id]}>
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="header-content"
        class:not-expandable={!$filterByLabels && $filterByLabelFamilies}
        onclick={(event) => ($filterByLabels ? onClickLabelExpander(labelSet.id, event) : undefined)}>
        {#if $filterByLabelFamilies}
          <Checkbox
            checked={$selectedLabelSets.includes(labelSet.id)}
            disabled={$preselection.includes(labelSet.id)}
            on:change={(event) => selectLabelSet(labelSet, event.detail)}>
            {labelSet.title}
          </Checkbox>
        {:else}
          <div title={labelSet.title}>{labelSet.title}</div>
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
              checked={$selectedLabels.includes(getFilterFromLabel({ labelset: labelSet.id, label: label.title })) ||
                $selectedLabelSets.includes(labelSet.id)}
              disabled={$selectedLabelSets.includes(labelSet.id) ||
                $preselection.includes(getFilterFromLabel({ labelset: labelSet.id, label: label.title }))}
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
      <!-- svelte-ignore a11y_click_events_have_key_events -->
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <div
        class="header-content"
        onclick={() => toggleEntitiesExpander(family.id)}>
        <span title={family.title}>
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
              checked={$selectedEntities.includes(getFilterFromEntity({ family: family.id, entity: entity }))}
              on:change={(event) => selectEntity(family, entity, event.detail)}>
              {entity}
            </Checkbox>
          </div>
        {/each}
      </div>
    {/if}
  {/each}
</div>

<style src="./SearchFilters.css"></style>
