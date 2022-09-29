<script lang="ts">
  import type { WidgetAction } from '../../core/models';
  import { getWidgetActions } from '../../core/store';
  import { getCDN } from '../../core/utils';
  import { clickOutside } from '../../common/actions/actions';

  export let uid: string;

  let actions = getWidgetActions();
  let displayMenu = false;
  const toggleMenu = () => {
    displayMenu = !displayMenu;
  };
  const closeMenu = () => {
    displayMenu = false;
  };
  const clickMenu = (item: WidgetAction) => {
    displayMenu = false;
    item.action(uid);
  };
</script>

{#if actions.length > 0}
  <div class="sw-action-menu" use:clickOutside on:outclick={closeMenu}>
    <button on:click|preventDefault={toggleMenu}>
      <img src={`${getCDN()}icons/more-vertical.svg`} alt="more" />
    </button>
    {#if displayMenu}
      <ul class="menu">
        {#each actions as item}
          <li on:click={() => clickMenu(item)} class:destructive={item.destructive}>
            {item.label}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style lang="scss" src="./ActionMenu.scss"></style>
