<script lang="ts">
  import { hasAuthData } from '../../../core/api';
  import Paragraph from './Paragraph.svelte';
  import LabelMenu from '../menus/LabelMenu.svelte';
  import type { ParagraphLabels } from '../../../core/models';
  import { canEditLabels } from '../../../core/stores/widget.store';
  import { createEventDispatcher } from 'svelte';
  import type { Classification } from '@nuclia/core';

  export let labels: ParagraphLabels = { labels: [], annotatedLabels: [] };

  const dispatch = createEventDispatcher();
  let selected: { [key: string]: boolean } = {};
  $: selected = [...labels.labels, ...labels.annotatedLabels].reduce((acc, current) => {
    acc[`${current.labelset}-${current.label}`] = true;
    return acc;
  }, {} as { [key: string]: boolean });

  let isOpenMenu = false;
  let element: HTMLElement;
  let position: { top: number; left: number } | undefined = undefined;

  const handleClick = (event: MouseEvent) => {
    if (event.button === 2) {
      event.preventDefault();
      const { top, left } = element.getBoundingClientRect();
      position = {
        top: event.clientY - Math.round(top),
        left: event.clientX - Math.round(left),
      };
      isOpenMenu = true;
    }
  };

  const toggleLabel = ({ labelset, label }: Classification) => {
    const newLabels = !!selected[`${labelset}-${label}`]
      ? labels.annotatedLabels.filter((item) => !(item.labelset === labelset && item.label === label))
      : [...labels.annotatedLabels, { labelset, label }];
    dispatch('labelsChange', newLabels);
  };
</script>

<div
  class="paragraph-with-menu"
  on:contextmenu={($canEditLabels && hasAuthData() && handleClick) || null}
  bind:this={element}>
  <Paragraph
    {labels}
    on:labelsChange={(event) => toggleLabel(event.detail)}>
    <slot
      name="icon"
      slot="icon" />
    <slot
      name="content"
      slot="content" />
  </Paragraph>
  {#if isOpenMenu}
    <LabelMenu
      {labels}
      {position}
      on:close={() => (isOpenMenu = false)}
      on:labelsChange={(event) => toggleLabel(event.detail)} />
  {/if}
</div>

<style
  lang="scss"
  src="./ParagraphWithMenu.scss"></style>
