<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { map, Observable } from 'rxjs';
  import { getCDN } from '../../../core/utils';
  import { viewerStore } from '../../../core/old-stores/viewer.store';
  import { clickOutside } from '../../../common/actions/actions';
  import Label from '../../../common/label/Label.svelte';
  import type { ParagraphLabels } from '../../../core/models';
  import { LabelSetKind } from '@nuclia/core';
  import { LabelSetWithId, orderedLabelSetList } from '../../../core/stores/labels.store';

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

  const labelSetList: Observable<LabelSetWithId[]> = orderedLabelSetList.pipe(
    map((labelSets) =>
      labelSets.filter((labelSet) => labelSet.kind.length === 0 || labelSet.kind.includes(LabelSetKind.PARAGRAPHS)),
    ),
  );

  let openLabelset: string | null = null;
  const enter = (labelSet: string) => {
    openLabelset = labelSet;
  };

  const toggleLabel = (labelset: string, label: string) => {
    const newLabels = !!selected[`${labelset}-${label}`]
      ? labels.annotatedLabels.filter((item) => !(item.labelset === labelset && item.label === label))
      : [...labels.annotatedLabels, { labelset, label }];
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
  on:outclick={close}>
  <div class="current-labels">
    {#each labels.annotatedLabels as label (label.labelset + label.label)}
      <span class="current-label">
        <Label
          {label}
          removable
          on:remove={() => !$savingLabels && toggleLabel(label.labelset, label.label)} />
      </span>
    {/each}
  </div>
  <div class="labelsets">
    {#each $labelSetList || [] as labelSet}
      <div
        class="labelset"
        on:mouseenter={() => enter(labelSet.id)}
        on:mouseleave={leave}>
        <button on:click={() => enter(labelSet.id)}>
          <span
            class="color"
            style:background-color={labelSet.color} />
          <span class="name">{labelSet.title}</span>
          <img
            src={`${getCDN()}icons/chevron-right.svg`}
            alt="close" />
        </button>
        <div
          class="labels"
          class:open={openLabelset === labelSet.id}>
          {#each labelSet.labels as label, i}
            <div class="label">
              <input
                id={`${labelSet.id}-${i}`}
                type="checkbox"
                bind:checked={selected[`${labelSet.id}-${label.title}`]}
                on:change={() => toggleLabel(labelSet.id, label.title)}
                disabled={$savingLabels || readOnly[`${labelSet.id}-${label.title}`]} />
              <label for={`${labelSet.id}-${i}`}>{label.title}</label>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style
  lang="scss"
  src="./LabelMenu.scss"></style>
