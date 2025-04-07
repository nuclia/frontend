<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { freezeBackground, iOSDevice, getFixedRootParentIfAny, unblockBackground } from './modal.utils';

  export let show = false;
  export let popup = false;
  export let parentElement: HTMLElement | undefined = undefined;
  export let fixedRootParent: HTMLElement | undefined = undefined;
  export let alignTo = '';
  export let modalWidth = '';
  let top: number | undefined = undefined;
  let left: number | undefined = undefined;
  let fixedRootParentChecked = false;

  const isIOS = iOSDevice();

  $: {
    if (!popup) {
      if (show) {
        freezeBackground();
      } else {
        unblockBackground();
      }
    }
  }

  export function refreshPosition() {
    if (parentElement) {
      if (!fixedRootParentChecked) {
        fixedRootParent = getFixedRootParentIfAny(parentElement);
        fixedRootParentChecked = true;
      }
      const parentPosition = parentElement?.getBoundingClientRect();
      if (fixedRootParent) {
        const containerRect = fixedRootParent.getBoundingClientRect();
        const scrollTop = fixedRootParent.scrollTop;
        top = parentPosition.bottom - containerRect.top + scrollTop;
        left = (alignTo === 'right' ? parentPosition?.right : parentPosition?.left) - containerRect.left;
      } else {
        top = parentPosition.bottom;
        left = alignTo === 'right' ? parentPosition?.right : parentPosition?.left;
      }
      if (isIOS) {
        top += window.scrollY;
      }
    }
  }

  $: if (show) {
    refreshPosition();
  }

  const dispatch = createEventDispatcher();
  let modalContentHeight: string = '100%';
  let modalContentContainer: HTMLElement;

  function setModalContentHeight() {
    if (modalContentContainer) {
      modalContentHeight = `${modalContentContainer.getBoundingClientRect().height}px`;
    }
  }

  onMount(() => {
    setModalContentHeight();
    setTimeout(() => {
      refreshPosition();
    });
  });

  const close = () => {
    show = false;
    if (!popup) {
      unblockBackground();
    }
    dispatch('close');
  };
  const outsideClick = () => {
    close();
  };
  const insideClick = (event: MouseEvent) => {
    event.stopPropagation();
  };
  const closeOnEsc = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
    }
  };
</script>

<svelte:window
  on:keydown={closeOnEsc}
  on:resize={setModalContentHeight} />
{#if show}
  <div
    class="sw-modal-backdrop fade"
    class:visible={!popup}
    class:popup
    class:align-right={alignTo === 'right'}
    on:click={outsideClick}>
    <dialog
      class="modal"
      on:click={insideClick}
      style:--popup-top="{top || 0}px"
      style:--popup-left="{left || 0}px"
      style:--modal-width={modalWidth ? modalWidth : ''}>
      <div
        class="modal-content"
        bind:this={modalContentContainer}
        style:--modal-content-height={modalContentHeight}>
        <slot />
      </div>
    </dialog>
  </div>
{/if}

<style
  lang="scss"
  src="./Modal.scss"></style>
