<script lang="ts">
  import DocTypeIndicator from '../../common/indicators/DocTypeIndicator.svelte';
  import { IconButton } from '../../common';
  import { _ } from '../../core/i18n';
  import { FIELD_TYPE } from '@nuclia/core';
  import { createEventDispatcher } from 'svelte';
  import { filter, take } from 'rxjs';
  import { fieldType, getFieldUrl } from '../../core/stores/viewer.store';

  export let expanded = false;
  export let headerActionsWidth = 0;
  export let resourceTitle = '';
  export let typeIndicator = '';

  const dispatch = createEventDispatcher();

  function close() {
    dispatch('close');
  }

  function clickOnTitle() {
    dispatch('clickOnTitle');
  }

  function openOrigin() {
    getFieldUrl()
      .pipe(
        take(1),
        filter((url) => !!url),
      )
      .subscribe((url) => window.open(url, 'blank', 'noreferrer'));
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
      {resourceTitle}
    </h3>
    {#if expanded && (fieldType.getValue() === FIELD_TYPE.file || fieldType.getValue() === FIELD_TYPE.link)}
      <IconButton
        icon={fieldType.getValue() === FIELD_TYPE.file ? 'download' : 'square-arrow'}
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
