<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let show = false;
  export let popup = false;
  export let closeButton = false;
  export let backButton = false;
  export let parentPosition: DOMRect | undefined = undefined;
  export let alignTo = '';

  const dispatch = createEventDispatcher();
  let overflow = 'initial';

  $: {
    if (show) {
      overflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = overflow;
    }
  }
  const close = () => {
    show = false;
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

<svelte:window on:keydown={closeOnEsc} />
{#if show}
  <div class="sw-modal-backdrop fade" class:popup class:align-right={alignTo === 'right'} on:click={outsideClick}>
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
      <div class="modal-content"><slot /></div>
    </dialog>
  </div>
{/if}
