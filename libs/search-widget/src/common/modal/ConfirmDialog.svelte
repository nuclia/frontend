<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../button/Button.svelte';
  import { freezeBackground, unblockBackground } from './modal.utils';

  export let show = false;
  export let closeable = false;
  export let buttons = [
    { label: 'Cancel', action: 'cancel' },
    { label: 'Confirm', action: 'confirm', kind: 'primary' },
  ];

  $: show && freezeBackground();

  const dispatch = createEventDispatcher();
  const close = (action) => {
    show = false;
    unblockBackground();
    dispatch(action);
  };
  const outsideClick = () => {
    if (closeable) {
      close('cancel');
    }
  };
</script>

{#if show}
  <div
    class="sw-modal-backdrop fade"
    on:click={outsideClick}>
    <dialog class="modal">
      <div class="modal-content">
        <slot />
        <footer class="confirm-footer">
          {#each buttons as button}
            <Button
              kind={button.kind || 'secondary'}
              on:click={() => close(button.action)}>
              {button.label}
            </Button>
          {/each}
        </footer>
      </div>
    </dialog>
  </div>
{/if}

<style
  lang="scss"
  src="./ConfirmDialog.scss"></style>
