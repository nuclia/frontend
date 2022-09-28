<script context="module" lang="ts">
  export enum ParagraphIcon {
    EXPAND = 'expand',
    PLAY = 'play',
  }
</script>

<script lang="ts">
  import ParagraphWithMenu from './ParagraphWithMenu.svelte';
  import { getCDN } from '../../core/utils';
  import { ParagraphLabels } from '../../core/models';

  export let text: string;
  export let textIcon: string;
  export let active: boolean = false;
  export let icon: ParagraphIcon;
  export let labels: ParagraphLabels;
  let hover = false;

  const enter = () => {
    hover = true;
  };
  const leave = () => {
    hover = false;
  };
</script>

<ParagraphWithMenu class="sw-paragraph-with-icon" {labels} on:labelsChange>
  <div slot="icon" class="icon" class:active={active || hover} on:mouseenter={enter} on:mouseleave={leave} on:click>
    {#if active || hover}
      <img src={`${getCDN()}icons/${icon}.svg`} alt="Expand" />
    {/if}
    <span>{textIcon}</span>
  </div>
  <span class="text" slot="content" class:active={active || hover} on:mouseenter={enter} on:mouseleave={leave} on:click>
    {text}
  </span>
</ParagraphWithMenu>

<style lang="scss" src="./ParagraphWithIcon.scss"></style>
