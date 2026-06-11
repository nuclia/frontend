<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import { clickOutside } from '../actions/actions';
  import { createFocusTrap } from '../focusTrap';
  import { freezeBackground, unblockBackground } from '../modal/modal.utils';

  interface Props {
    position?: { top?: number; bottom?: number; left: number; right?: number; width: number } | undefined;
    secondary?: boolean;
    children?: import('svelte').Snippet;
  }

  let { position = undefined, secondary = false, children }: Props = $props();
  let dropdownEl: HTMLElement = $state();

  const { trapFocus, restoreFocus } = createFocusTrap(() => dropdownEl);

  const dispatch = createEventDispatcher();
  const close = () => {
    dispatch('close');
  };

  onMount(() => {
    if (!secondary) {
      freezeBackground();
    }

    trapFocus();

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      }
    };
    document.addEventListener('keydown', handleEscape);

    return () => {
      if (!secondary) {
        unblockBackground();
      }
      restoreFocus();
      document.removeEventListener('keydown', handleEscape);
    };
  });
</script>

<div
  bind:this={dropdownEl}
  class="sw-dropdown"
  style:left={typeof position?.left === 'number' ? position?.left + 'px' : 'auto'}
  style:right={typeof position?.right === 'number' ? position?.right + 'px' : 'auto'}
  style:top={typeof position?.top === 'number' ? position?.top + 'px' : 'auto'}
  style:bottom={typeof position?.bottom === 'number' ? position?.bottom + 'px' : 'auto'}
  style:width={position?.width + 'px'}
  use:clickOutside
  onoutclick={close}>
  {@render children?.()}
</div>

<style src="./Dropdown.css"></style>
