<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import ModalHeader from './ModalHeader.svelte';

  export let show = false;
  export let popup = false;
  export let transparent = false;
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
  <div class="modal-backdrop fade" class:popup class:align-right={alignTo === 'right'} on:click={outsideClick}>
    <dialog
      class="modal"
      class:transparent
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

<style>
  .modal-backdrop {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: var(--z-index-modal-backdrop);
  }

  .fade {
    animation: fadeIn 400ms;
    -webkit-animation: fadeIn 400ms;
    -moz-animation: fadeIn 400ms;
    -o-animation: fadeIn 400ms;
    -ms-animation: fadeIn 400ms;
  }

  @keyframes fadeIn {
    0% {
      opacity: 0;
    }
    100% {
      opacity: 1;
    }
  }
  .modal-backdrop:not(.popup) {
    background-color: var(--color-backdrop);
  }

  .modal {
    align-items: stretch;
    border: 0;
    display: flex;
    flex: 1 1 0;
    flex-flow: column nowrap;
    padding: 0;
    color: inherit;
    margin: 0;
    z-index: var(--z-index-modal);
    max-width: 100vw;
    background-color: transparent;
  }
  .modal:not(.transparent) .modal-content {
    background-color: var(--color-light-stronger);
    box-shadow: var(--shadow-modal);
  }

  .modal.transparent .modal-content {
    overflow: auto;
    padding-right: 16px;
  }
  .modal.transparent .modal-content::-webkit-scrollbar {
    width: 6px;
  }
  .modal.transparent .modal-content::-webkit-scrollbar-thumb {
    background-color: #000;
  }
  .modal.transparent .modal-content::-webkit-scrollbar-track {
    background-color: #fff;
  }

  :not(.popup) .modal {
    position: relative;
    top: 50%;
    left: 50%;
    transform: translateX(-50%) translateY(-50%);
  }

  .popup .modal {
    position: fixed;
    top: var(--popup-top);
    left: 0;
    margin-top: 5px;
    width: 100vw;
  }

  .modal-content {
    z-index: 0;
    overflow: scroll;
  }
  .modal:not(.transparent) .modal-content {
    padding: 16px;
  }

  @media (min-width: 599px) {
    .modal {
      max-height: calc(100vh - var(--popup-top));
      max-width: calc(100vw - 20px);
    }
    .popup .modal {
      left: var(--popup-left);
      width: 500px;
    }
    .popup.align-right .modal {
      left: max(calc(var(--popup-left) - 500px), 0px);
      width: 500px;
    }
  }
</style>
