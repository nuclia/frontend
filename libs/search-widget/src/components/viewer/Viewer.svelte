<script lang="ts">
  import {
    _,
    getFieldUrl,
    getWidgetActions,
    isPreviewing,
    viewerData,
    viewerState,
    ViewerState,
    WidgetAction
  } from '../../core';
  import { DocTypeIndicator, Dropdown, IconButton, isMobileViewport } from '../../common';
  import { onDestroy, onMount } from 'svelte';
  import { FIELD_TYPE } from '@nuclia/core';
  import { debounceTime, filter, Subject, take } from 'rxjs';
  import SearchResultNavigator from '../../tiles/base-tile/header/SearchResultNavigator.svelte';

  let data: ViewerState;
  const stateSubscription = viewerData.subscribe((value) => data = value);
  const resizeEvent = new Subject();

  let innerWidth = window.innerWidth;
  let menuItems: WidgetAction[] = [];
  let menuButton: HTMLElement | undefined;
  let menuPosition: { left: number; top: number } | undefined;
  let displayMenu = false;
  let resultNavigatorDisabled = false;
  let resultNavigatorWidth = 0;

  let headerActionsWidth = 0;
  const buttonWidth = 40;
  $: hasMenu = menuItems.length > 0;
  $: actionsWidth = headerActionsWidth + (hasMenu ? buttonWidth * 2 : buttonWidth);
  $: isMobile = isMobileViewport(innerWidth);

  onMount(() => {
    resizeEvent.pipe(debounceTime(100)).subscribe(() => setHeaderActionWidth());
    menuItems = getWidgetActions();
  });

  function setHeaderActionWidth() {
    headerActionsWidth = isMobile ? 0 : resultNavigatorWidth;
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
      const menuWidth = 176;
      menuPosition = {
        left: menuButton.offsetLeft - menuWidth + menuButton.offsetWidth,
        top: menuButton.clientHeight + 6,
        width: menuWidth,
      };
      // TODO: close side panel
    }
  }

  function clickOnMenu(item: WidgetAction) {
    const fullId = data.fieldFullId;
    if (fullId) {
      item.action(fullId);
    }
  }

  function openPrevious() {
    // TODO: openPrevious
  }
  function openNext() {
    // TODO: openNext
  }

  function close() {
    viewerState.reset();
  }

  onDestroy(() => {
    stateSubscription.unsubscribe();
  });
</script>

<svelte:window
  bind:innerWidth
  on:resize={(event) => resizeEvent.next(event)}></svelte:window>
{#if $isPreviewing}
  <div class="sw-viewer">
    <header style:--header-actions-width={`${actionsWidth}px`}>
      <div class="header-title">
        <DocTypeIndicator type={data.resultType} />
        <h3
          class="ellipsis title-m">
          {data.title}
        </h3>
        {#if data.fieldFullId.field_type === FIELD_TYPE.file || data.fieldFullId.field_type === FIELD_TYPE.link}
          <IconButton
            icon={data.fieldFullId.field_type === FIELD_TYPE.file ? 'download' : 'square-arrow'}
            ariaLabel={$_('resource.source')}
            aspect="basic"
            on:click={openOrigin} />
        {/if}
      </div>

      <div class="header-actions">
        {#if !isMobile && data.paragraphsCount > 1}
          <SearchResultNavigator
            resultIndex={data.selectedParagraphIndex}
            total={data.paragraphsCount}
            disabled={resultNavigatorDisabled}
            on:offsetWidth={(event) => (resultNavigatorWidth = event.detail.offsetWidth)}
            on:openPrevious={openPrevious}
            on:openNext={openNext} />
        {/if}

        {#if hasMenu && data.paragraphsCount > 1}
          <div class="separator" />
        {/if}
        {#if hasMenu}
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
              <ul class="viewer-menu">
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
    </header>

    <div class="viewer-content">
      {#if isMobile && data.paragraphsCount > 1}
        <SearchResultNavigator
          resultIndex={data.selectedParagraphIndex}
          total={data.paragraphsCount}
          disabled={resultNavigatorDisabled}
          on:openPrevious={openPrevious}
          on:openNext={openNext} />
      {/if}
    </div>
  </div>
{/if}

<style
  lang="scss"
  src="./Viewer.scss"></style>
