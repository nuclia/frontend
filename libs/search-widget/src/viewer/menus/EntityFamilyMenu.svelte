<script lang="ts">
  import { nucliaState } from '../../core/store';
  import { clickOutside } from '../../common/actions/actions';
  import { createEventDispatcher, onMount } from 'svelte';
  import { _ } from '../../core/i18n';

  export let position: { top: number; left: number };
  export let selectedFamily;

  let menuContainer: HTMLElement;

  const allEntities = nucliaState().entities;
  const dispatch = createEventDispatcher();
  const close = () => {
    dispatch('close');
  };

  onMount(() => {
    dispatch('menuHeight', {height: menuContainer.getBoundingClientRect().height});
  });

  function selectFamily(family) {
    dispatch('familySelection', {family});
  }
</script>

<div class="sw-entity-menu"
     use:clickOutside
     on:outclick={close}
     bind:this={menuContainer}
     style:left={position?.left + 'px'}
     style:top={position?.top + 'px'}>
  <ul>
    {#each $allEntities as family}
      <li style:--family-color={family.color}
          class:selected={family.id === selectedFamily}
          on:click={() => selectFamily(family)}>{$_(family.title)}</li>
    {/each}
  </ul>
</div>


<style lang="scss" src="./EntityFamilyMenu.scss"></style>
