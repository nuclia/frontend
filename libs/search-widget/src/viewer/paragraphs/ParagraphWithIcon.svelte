<script context="module" lang="ts">
  export enum ParagraphIcon {
    EXPAND = 'expand',
    PLAY = 'play',
  }
</script>

<script lang="ts">
  import ParagraphWithMenu from './ParagraphWithMenu.svelte';
  import { getCDN } from '../../core/utils';
  import type { Classification }  from '@nuclia/core'
  
  export let text: string;
  export let textIcon: string;
  export let active: boolean = false;
  export let icon: ParagraphIcon;
  export let labels: Classification[];
  let hover = false;

  const enter = () => {
    hover = true;
  };
  const leave = () => {
    hover = false;
  };
</script>

<ParagraphWithMenu labels={labels}>
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

<style>
  .icon {
    position: relative;
    display: flex;
  }
  .icon span {
    transition: transform 0.15s;
  }
  .icon.active span {
    transform: translate(22px, 0);
  }
  .icon.active img {
    position: absolute;
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    animation: fade 0.2s;
  }
  .icon,
  .text {
    cursor: pointer;
  }
  .active {
    font-weight: var(--font-weight-semi-bold);
  }
  @keyframes fade {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>
