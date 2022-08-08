<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { LabelSetKind } from '../../../sdk-core/src';
  import { map } from 'rxjs';
  import { getCDN } from '../core/utils';
  import { nucliaState } from '../core/store';
  import { viewerStore } from './store';
  import { clickOutside } from '../components/actions/actions';
  import Label from '../components/label/Label.svelte';
  import type { Classification }  from '@nuclia/core';

  const dispatch = createEventDispatcher();
  export let position: { top: number, left: number } | undefined = undefined;
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
  }

  const toggleLabel = (labelset: string, label: string) => {
    const newLabels = !!selected[`${labelset}-${label}`]
      ? labels.filter((item) => !(item.labelset === labelset && item.label === label))
      : [...labels, { labelset, label }];
    dispatch('labelsChange', newLabels);
  }
  const leave = () => {
    openLabelset = null;
  }
  const close = () => {
    dispatch('close');
  };
</script>

<div class="label-menu" 
  style:left={position?.left + 'px'}
  style:top={position?.top + 'px'}
  use:clickOutside
  on:outclick={close}
>
  <div class="current-labels">
    {#each labels as label (label.labelset + label.label)}
      <span class="current-label">
        <Label
          {label}
          removable
          on:remove={() => !$savingLabels && toggleLabel(label.labelset, label.label)}>
        </Label>
      </span>
    {/each}
  </div>
  <div class="labelsets">
    {#each ($labelsSets || []) as labelset}
      <div class="labelset" on:mouseenter={() => enter(labelset[0])} on:mouseleave={leave}>
        <button on:click={() => enter(labelset[0])}>
          <span class="color" style:background-color={labelset[1].color}></span>
          <span class="name">{ labelset[1].title }</span>
          <img src={`${getCDN()}icons/chevron-right.svg`} alt="close" />
        </button>
        <div class="labels" class:open={openLabelset === labelset[0]}>
          {#each labelset[1].labels as label, i}
            <div class="label">
              <input
                id={`${labelset[0]}-${i}`}
                type="checkbox"
                bind:checked={selected[`${labelset[0]}-${label.title}`]}
                on:change={() => {toggleLabel(labelset[0], label.title)}}
                disabled={$savingLabels}
              >
              <label for={`${labelset[0]}-${i}`}>{ label.title }</label>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .label-menu {
    position: absolute;
    width: 182px;
    box-shadow: var(--shadow-modal);
    background-color: var(--color-light-stronger);
    z-index: 1;
  }
  .labelset {
    position: relative;
  }
  button {
    width: 100%;
    height: 2em;
    display: flex;
    align-items: center;
    padding: 0 1em;
    border: 0;
    background: #fff;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
    -webkit-appearance: none;
  }
  button:hover {
    background-color: var(--color-dark-light);
  }
  button .name {
    flex: 0 1 auto;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  button .color {
    flex: 0 0 auto;
    width: 8px;
    height:8px;
    margin-right: 0.75em;
    filter: saturate(100) brightness(80%);
  }
  button img {
    flex: 0 0 auto;
    width: 18px;
    margin-left: auto;
  }
  .labels {
    display: none;
    position: absolute;
    left: 100%;
    top: 0;
    width: 170px;
    max-height: calc(1.75em * 8);
    padding: 0.25em 0.5em;
    overflow: auto;
    box-shadow: var(--shadow-modal);
    background-color: var(--color-light-stronger);
  }
  .labels.open {
    display: block;
  }
  .label {
    display: flex;
    height: 1.75em;
    align-items: center;
  }
  .label input {
    flex: 0 0 auto;
    margin-right: 0.75em;
    accent-color: var(--color-primary-regular);
  }
  .label label {
    flex: 0 1 auto;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
  }
  .current-labels {
    padding: 0.5em;
    border-bottom: 1px solid var(--color-dark-light);
  }
  .current-label {
    margin: 0 0 0.25em 0;
  }
</style>
