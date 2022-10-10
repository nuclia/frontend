<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { map } from 'rxjs';
  import { getCDN } from '../../../core/utils';
  import { viewerStore } from '../../../core/old-stores/viewer.store';
  import { clickOutside } from '../../../common/actions/actions';
  import Label from '../../../common/label/Label.svelte';
  import type { ParagraphLabels } from '../../../core/models';
  import { LabelSetKind } from '@nuclia/core';
  import { labelSets } from '../../../core/stores/labels.store';

  const dispatch = createEventDispatcher();
  export let position: { top: number; left: number } | undefined = undefined;
  export let labels: ParagraphLabels = { labels: [], annotatedLabels: [] };

  const savingLabels = viewerStore.savingLabels;
  let selected: { [key: string]: boolean } = {};

  $: selected = [...labels.labels, ...labels.annotatedLabels].reduce((acc, current) => {
    acc[`${current.labelset}-${current.label}`] = true;
    return acc;
  }, {} as { [key: string]: boolean });

  $: readOnly = labels.labels.reduce((acc, current) => {
    acc[`${current.labelset}-${current.label}`] = true;
    return acc;
  }, {} as { [key: string]: boolean });

  const labelSetList = labelSets.pipe(
    map((set) =>
      Object.entries(set)
        .filter(([id, labelSet]) => labelSet.kind.length === 0 || labelSet.kind.includes(LabelSetKind.PARAGRAPHS))
        .sort(([keyA, labelSetA], [keyB, labelSetB]) => labelSetA.title.localeCompare(labelSetB.title)),
    ),
  );

  let openLabelset: string | null = null;
  const enter = (labelSet: string) => {
    openLabelset = labelSet;
  };

  const toggleLabel = (labelset: string, label: string) => {
    const newLabels = !!selected[`${labelset}-${label}`]
      ? labels.annotatedLabels.filter((item) => !(item.labelset === labelset && item.label === label))
      : [...labels.annotatedLabels, {labelset, label}];
    dispatch('labelsChange', newLabels);
  };
  const leave = () => {
    openLabelset = null;
  };
  const close = () => {
    dispatch('close');
  };
</script>

<div
  class="sw-label-menu"
  style:left={position?.left + 'px'}
  style:top={position?.top + 'px'}
  use:clickOutside
  on:outclick={close}
>
  <div class="current-labels">
    {#each labels.annotatedLabels as label (label.labelset + label.label)}
      <span class="current-label">
        <Label {label} removable on:remove={() => !$savingLabels && toggleLabel(label.labelset, label.label)}/>
      </span>
    {/each}
  </div>
  <div class="labelsets">
    {#each $labelSetList || [] as [labelSetId, labelSet]}
      <div class="labelset" on:mouseenter={() => enter(labelSetId)} on:mouseleave={leave}>
        <button on:click={() => enter(labelSetId)}>
          <span class="color" style:background-color={labelSet.color}/>
          <span class="name">{labelSet.title}</span>
          <img src={`${getCDN()}icons/chevron-right.svg`} alt="close"/>
        </button>
        <div class="labels" class:open={openLabelset === labelSetId}>
          {#each labelSet.labels as label, i}
            <div class="label">
              <input
                id={`${labelSetId}-${i}`}
                type="checkbox"
                bind:checked={selected[`${labelSetId}-${label.title}`]}
                on:change={() => toggleLabel(labelSetId, label.title) }
                disabled={$savingLabels || readOnly[`${labelSetId}-${label.title}`]}
              />
              <label for={`${labelSetId}-${i}`}>{label.title}</label>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style lang="scss" src="./LabelMenu.scss"></style>
