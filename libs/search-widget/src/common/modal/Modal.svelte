<script lang="ts">
  import { run } from 'svelte/legacy';

  import { createEventDispatcher, onMount } from 'svelte';
  import { freezeBackground, getFixedRootParentIfAny, iOSDevice, unblockBackground } from './modal.utils';

  interface Props {
    show?: boolean;
    popup?: boolean;
    parentElement?: HTMLElement | undefined;
    fixedRootParent?: HTMLElement | undefined;
    alignTo?: string;
    modalWidth?: string;
    children?: import('svelte').Snippet;
  }

  let {
    show = $bindable(false),
    popup = false,
    parentElement = undefined,
    fixedRootParent = $bindable(undefined),
    alignTo = '',
    modalWidth = '',
    children,
  }: Props = $props();
  let top: number | undefined = $state(undefined);
  let left: number | undefined = $state(undefined);
  let fixedRootParentChecked = false;

  const isIOS = iOSDevice();

  run(() => {
    if (!popup) {
      if (show) {
        freezeBackground();
      } else {
        unblockBackground();
      }
    }
  });

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

  run(() => {
    if (show) {
      refreshPosition();
    }
  });

  const dispatch = createEventDispatcher();
  let modalContentHeight: string = $state('100%');
  let modalContentContainer: HTMLElement = $state();

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
  onkeydown={closeOnEsc}
  onresize={setModalContentHeight} />
{#if show}
  <div
    class="sw-modal-backdrop fade"
    class:visible={!popup}
    class:popup
    class:align-right={alignTo === 'right'}
    onclick={outsideClick}>
    <dialog
      class="modal"
      onclick={insideClick}
      style:--popup-top="{top || 0}px"
      style:--popup-left="{left || 0}px"
      style:--modal-width={modalWidth ? modalWidth : ''}>
      <div
        class="modal-content"
        bind:this={modalContentContainer}
        style:--modal-content-height={modalContentHeight}>
        {@render children?.()}
      </div>
    </dialog>
  </div>
{/if}

<style src="./Modal.css"></style>
