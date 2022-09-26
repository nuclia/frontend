<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { map } from 'rxjs';
  import { getCDN } from '../../core/utils';
  import { nucliaState } from '../../core/store';
  import { viewerStore } from '../viewer.store';
  import { clickOutside } from '../../components/actions/actions';
  import Label from '../../components/label/Label.svelte';
  import type { Classification } from '../../../../sdk-core/src';
  import { LabelSetKind } from '../../../../sdk-core/src';

  const dispatch = createEventDispatcher();
  export let position: { top: number; left: number } | undefined = undefined;
  export let labels: Classification[] = [];

  const savingLabels = viewerStore.savingLabels;
  let selected: { [key: string]: boolean } = {};
  $: selected = labels.reduce((acc, current) => {
    acc[`${current.labelset}-${current.label}`] = true;
    return acc;
  }, {} as { [key: string]: boolean });

  const labelsSets = nucliaState().labels.pipe(
    map((labels) =>
      Object.entries(labels)
        .filter((labelSet) => labelSet[1].kind.length === 0 || labelSet[1].kind.includes(LabelSetKind.PARAGRAPHS))
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB)),
    ),
  );

  let openLabelset: string | null = null;
  const enter = (labelSet: string) => {
    openLabelset = labelSet;
  };

  const toggleLabel = (labelset: string, label: string) => {
    const newLabels = !!selected[`${labelset}-${label}`]
      ? labels.filter((item) => !(item.labelset === labelset && item.label === label))
      : [...labels, { labelset, label }];
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
    {#each labels as label (label.labelset + label.label)}
      <span class="current-label">
        <Label {label} removable on:remove={() => !$savingLabels && toggleLabel(label.labelset, label.label)} />
      </span>
    {/each}
  </div>
  <div class="labelsets">
    {#each $labelsSets || [] as labelset}
      <div class="labelset" on:mouseenter={() => enter(labelset[0])} on:mouseleave={leave}>
        <button on:click={() => enter(labelset[0])}>
          <span class="color" style:background-color={labelset[1].color} />
          <span class="name">{labelset[1].title}</span>
          <img src={`${getCDN()}icons/chevron-right.svg`} alt="close" />
        </button>
        <div class="labels" class:open={openLabelset === labelset[0]}>
          {#each labelset[1].labels as label, i}
            <div class="label">
              <input
                id={`${labelset[0]}-${i}`}
                type="checkbox"
                bind:checked={selected[`${labelset[0]}-${label.title}`]}
                on:change={() => {
                  toggleLabel(labelset[0], label.title);
                }}
                disabled={$savingLabels}
              />
              <label for={`${labelset[0]}-${i}`}>{label.title}</label>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style lang="scss" src="./LabelMenu.scss"></style>
