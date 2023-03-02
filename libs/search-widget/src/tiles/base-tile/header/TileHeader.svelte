<script lang="ts">
  import DocTypeIndicator from '../../../common/indicators/DocTypeIndicator.svelte';
  import { IconButton } from '../../../common';
  import { _ } from '../../../core/i18n';
  import { FIELD_TYPE } from '@nuclia/core';
  import { createEventDispatcher, onMount } from 'svelte';
  import { filter, take } from 'rxjs';
  import { fieldFullId, fieldType, getFieldUrl } from '../../../core/stores/viewer.store';
  import { getWidgetActions } from '../../../core/stores/widget.store';
  import { WidgetAction } from '../../../core/models';
  import Dropdown from '../../../common/dropdown/Dropdown.svelte';

  export let expanded = false;
  export let headerActionsWidth = 0;
  export let resourceTitle = '';
  export let typeIndicator = '';

  const dispatch = createEventDispatcher();

  let menuItems: WidgetAction[] = [];

  let menuButton: HTMLElement | undefined;
  let menuPosition: { left: number; top: number } | undefined;
  let displayMenu = false;

  $: hasActions = menuItems.length > 0;

  onMount(() => {
    menuItems = getWidgetActions();
  });

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

  function openMenu(event) {
    event.stopPropagation();
    if (menuButton) {
      displayMenu = true;
      const menuWidth = 128;
      menuPosition = {
        left: menuButton.offsetLeft - menuWidth + menuButton.offsetWidth,
        top: menuButton.clientHeight + 6,
        width: menuWidth,
      };
    }
  }

  function clickOnMenu(item: WidgetAction) {
    const fullId = fieldFullId.getValue();
    if (fullId) {
      item.action(fullId);
    }
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
      {#if $$slots.default && hasActions}
        <div class="separator" />
      {/if}
      {#if hasActions}
        <div bind:this={menuButton}>
          <IconButton
            icon="more-vertical"
            aspect="basic"
            on:click={openMenu} />
        </div>

        {#if displayMenu}
          <Dropdown
            position={menuPosition}
            on:close={() => (displayMenu = false)}>
            <ul class="tile-menu">
              {#each menuItems as item}
                <li on:click={() => clickOnMenu(item)}>{item.label}</li>
              {/each}
            </ul>
          </Dropdown>
        {/if}
      {/if}
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
