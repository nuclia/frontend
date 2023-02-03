<script lang="ts">
  import DocTypeIndicator from '../../common/indicators/DocTypeIndicator.svelte';
  import { IconButton } from '../../common';
  import { _ } from '../../core/i18n';
  import { FIELD_TYPE, Search } from '@nuclia/core';
  import { createEventDispatcher } from 'svelte';
  import { getFieldUrl } from '../../core/stores/resource.store';
  import { take } from 'rxjs';

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

  function openOrigin() {
    if (!result.field) {
      return;
    }
    getFieldUrl(result.field)
      .pipe(take(1))
      .subscribe((url) => {
        if (url) {
          window.open(url, 'blank', 'noreferrer');
        }
      });
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
    {#if expanded && (result.field?.field_type === FIELD_TYPE.file || result.field?.field_type === FIELD_TYPE.link)}
      <IconButton
        icon={result.field.field_type === FIELD_TYPE.file ? 'download' : 'square-arrow'}
        ariaLabel={$_('resource.source')}
        aspect="basic"
        on:click={openOrigin} />
    {/if}
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
