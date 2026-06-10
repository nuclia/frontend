<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Button from '../button/Button.svelte';
  import { createFocusTrap } from '../focusTrap';
  import { freezeBackground, unblockBackground } from './modal.utils';

  interface Props {
    show?: boolean;
    closeable?: boolean;
    buttons?: any;
    children?: import('svelte').Snippet;
  }

  let {
    show = $bindable(false),
    closeable = false,
    buttons = [
      { label: 'Cancel', action: 'cancel' },
      { label: 'Confirm', action: 'confirm', kind: 'primary' },
    ],
    children,
  }: Props = $props();

  let dialogEl: HTMLDialogElement = $state();
  const { trapFocus, restoreFocus } = createFocusTrap(() => dialogEl);

  $effect(() => {
    if (show) {
      freezeBackground();
      trapFocus();
    }
  });

  const dispatch = createEventDispatcher();
  const close = (action) => {
    show = false;
    unblockBackground();
    restoreFocus();
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
    onclick={outsideClick}>
    <dialog
      class="modal"
      bind:this={dialogEl}
      aria-modal="true">
      <div class="modal-content">
        {@render children?.()}
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

<style src="./ConfirmDialog.css"></style>
