<script lang="ts">
  import { hasAuthData } from '../../../core/api';
  import { nucliaState } from '../../../core/stores/main.store';
  import { filter, map } from 'rxjs';
  import Paragraph from './Paragraph.svelte';
  import LabelMenu from '../menus/LabelMenu.svelte';
  import { ParagraphLabels } from '../../../core/models';

  export let labels: ParagraphLabels;
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
  on:contextmenu={($editLabels && hasAuthData() && handleClick) || null}
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

<style lang="scss" src="./ParagraphWithMenu.scss"></style>
