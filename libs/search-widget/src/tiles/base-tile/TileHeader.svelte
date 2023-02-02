<script lang="ts">
  import DocTypeIndicator from '../../common/indicators/DocTypeIndicator.svelte';
  import { IconButton } from '../../common';
  import { _ } from '../../core/i18n';
  import { Search } from '@nuclia/core';
  import { createEventDispatcher } from 'svelte';

  export let expanded = false;
  export let headerActionsWidth = 0;
  export let result: Search.SmartResult;
  export let typeIndicator = '';

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  function clickOnTitle() {
    dispatch('clickOnTitle');
  }
</script>

<header
  class="sw-tile-header"
  class:expanded
  style:--header-actions-width={`${headerActionsWidth}px`}>
  <div class:header-title={expanded}>
    <div class="doc-type-container">
      <DocTypeIndicator type={typeIndicator} />
    </div>
    <h3
      class="ellipsis"
      on:click={() => clickOnTitle()}>
      {result?.title}
    </h3>
  </div>
  {#if expanded}
    <div class="header-actions">
      <slot />
      <IconButton
        icon="cross"
        ariaLabel={$_('generic.close')}
        aspect="basic"
        on:click={close} />
    </div>
  {/if}
</header>

<style
  lang="scss"
  src="./TileHeader.scss"></style>
