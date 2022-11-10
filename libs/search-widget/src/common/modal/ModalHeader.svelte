<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { getCDN } from '../../core/utils';
  export let closeButton = false;
  export let backButton = false;
  import { _ } from '../../core/i18n';

  const dispatch = createEventDispatcher();

  const close = () => {
    dispatch('close');
  };
  const back = () => {
    dispatch('back');
  };
</script>

<div class="sw-modal-header">
  {#if backButton}
    <button
      class="back"
      on:click={back}>
      {$_('modal.back')}
    </button>
  {/if}
  {#if closeButton}
    <button
      class="close"
      on:click={close}>
      <img
        src={`${getCDN()}icons/close-light.svg`}
        alt="icon" />
    </button>
  {/if}
</div>

<style
  lang="scss"
  src="./ModalHeader.scss"></style>
