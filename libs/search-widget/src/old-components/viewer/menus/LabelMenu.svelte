<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { map, Observable } from 'rxjs';
  import type { ParagraphLabels } from '../../../core/models';
  import { LabelSetKind } from '@nuclia/core';
  import { LabelSetWithId, orderedLabelSetList } from '../../../core/stores/labels.store';
  import Dropdown from '../../../common/dropdown/Dropdown.svelte';
  import Icon from '../../../common/icons/Icon.svelte';
  import { getParentLiRect } from '../../../common/label/label.utils';

  const dispatch = createEventDispatcher();
  export let position: { top: number; left: number } | undefined = undefined;
  export let labels: ParagraphLabels = { labels: [], annotatedLabels: [] };

  $: selectedLabels = labels.annotatedLabels.map((label) => label.label);
  let labelSetDropdownElement: HTMLElement | undefined;
  let submenuPosition: { left: number; top: number } | undefined;
  let showSubmenu = false;

  const labelSetList: Observable<LabelSetWithId[]> = orderedLabelSetList.pipe(
    map((labelSets) =>
      labelSets.filter((labelSet) => labelSet.kind.length === 0 || labelSet.kind.includes(LabelSetKind.PARAGRAPHS)),
    ),
  );

  let selectedLabelSet: LabelSetWithId | null = null;
  const enter = (event, labelSet: LabelSetWithId, index: number, total: number) => {
    selectedLabelSet = labelSet;
    showSubmenu = true;
    if (labelSetDropdownElement && position) {
      const dropdownRect = labelSetDropdownElement?.getBoundingClientRect();
      const left = position.left + dropdownRect.width;
      const top = position.top + Math.round((dropdownRect.height / total) * index);
      submenuPosition = { left, top };
    }
  };

  const toggleLabel = (labelset: string, label: string) => {
    dispatch('labelsChange', { labelset, label });
  };
  const leave = () => {
    selectedLabelSet = null;
  };
  const waitAndClose = () => {
    setTimeout(() => dispatch('close'));
  };
</script>

<Dropdown
  {position}
  on:close={waitAndClose}>
  <ul
    class="sw-dropdown-options sw-label-menu"
    bind:this={labelSetDropdownElement}>
    {#each $labelSetList as labelSet, i}
      <li
        class="label-set-option"
        on:mouseenter={(event) => enter(event, labelSet, i, $labelSetList.length)}>
        <div
          class="label-set-color"
          style:background-color={labelSet.color} />
        <div class="label-set-title ellipsis">{labelSet.title}</div>
        <Icon name="chevron-right" />
      </li>
    {/each}
  </ul>
</Dropdown>

{#if showSubmenu}
  <Dropdown
    position={submenuPosition}
    on:close={() => (showSubmenu = false)}>
    <ul class="sw-dropdown-options">
      {#each selectedLabelSet.labels as label}
        <li
          class="ellipsis"
          class:selected={selectedLabels.includes(label.title)}
          on:click={() => toggleLabel(selectedLabelSet.id, label.title)}>
          {label.title}
        </li>
      {/each}
    </ul>
  </Dropdown>
{/if}
