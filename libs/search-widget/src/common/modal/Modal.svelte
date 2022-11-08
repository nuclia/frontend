<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import ModalHeader from './ModalHeader.svelte';
  import { freezeBackground, unblockBackground } from './modal.utils';

  export let show = false;
  export let popup = false;
  export let closeButton = false;
  export let backButton = false;
  export let parentPosition: DOMRect | undefined = undefined;
  export let alignTo = '';

  $: show && !popup && freezeBackground();

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

<svelte:window on:keydown={closeOnEsc}
               on:resize={setModalContentHeight}/>
{#if show}
  <div class="sw-modal-backdrop fade"
       class:visible={!popup}
       class:popup
       class:align-right={alignTo === 'right'} on:click={outsideClick}>
    <dialog
      class="modal"
      on:click={insideClick}
      style="--popup-top: {parentPosition?.bottom || 0}px; --popup-left: {alignTo === 'right'
        ? parentPosition?.right || 0
        : parentPosition?.left || 0}px"
    >
      {#if backButton || closeButton}
        <ModalHeader {closeButton} {backButton} on:close={close} on:back />
      {/if}
      <div class="modal-content"
           bind:this={modalContentContainer}
           style:--modal-content-height={modalContentHeight}><slot /></div>
    </dialog>
  </div>
{/if}

<style lang="scss" src="./Modal.scss"></style>
