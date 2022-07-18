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

<div class="modal-header">
  {#if backButton}
    <button class="back" on:click={back}>{$_('modal.back')}</button>
  {/if}
  {#if closeButton}
    <button class="close" on:click={close}>
      <img src={`${getCDN()}icons/close-light.svg`} alt="icon" />
    </button>
  {/if}
</div>

<style>
  .modal-header {
    display: flex;
    align-items: center;
    height: 3em;
  }
  .back,
  .close {
    -webkit-appearance: none;
    border: none;
    margin: 0;
    padding: 0;
    width: auto;
    background: transparent;
    cursor: pointer;
  }
  .back {
    color: #fff;
    font: inherit;
    font-size: 1.2em;
    font-weight: var(--font-weight-bold);
  }
  .close {
    margin-left: auto;
  }
  .close img {
    width: 30px;
  }
</style>
