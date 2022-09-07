<script lang="ts">
  import type { Classification } from '@nuclia/core';
  import { hasAuthData } from '../../core/api';
  import { nucliaState } from '../../core/store';
  import { filter, map } from 'rxjs';
  import Paragraph from './Paragraph.svelte';
  import LabelMenu from '../LabelMenu.svelte';

  const MENU_ENABLED = false; // TODO: remove when backend is ready

  export let labels: Classification[] = [];
  let isOpenMenu = false;
  let element: HTMLElement;
  let position: { top: number; left: number } | undefined = undefined;

  const editLabels = nucliaState().widget.pipe(
    filter((widget) => !!widget),
    map((widget) => widget.features.editLabels),
  );

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
</script>

<div
  class="paragraph-with-menu"
  on:contextmenu={(MENU_ENABLED && $editLabels && hasAuthData() && handleClick) || null}
  bind:this={element}
>
  <Paragraph {labels}>
    <slot name="icon" slot="icon" />
    <slot name="content" slot="content" />
  </Paragraph>
  {#if isOpenMenu}
    <LabelMenu
      {labels}
      {position}
      on:close={() => {
        isOpenMenu = false;
      }}
      on:labelsChange
    />
  {/if}
</div>
