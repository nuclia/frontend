<script lang="ts">
  import type { WidgetAction } from '../core/models';
  import { getWidgetActions } from '../core/store';

  export let uid: string;

  let actions = getWidgetActions();
  let displayMenu = false;
  const toggleMenu = () => {
    displayMenu = !displayMenu;
  };
  const clickMenu = (item: WidgetAction) => {
    displayMenu = false;
    item.action(uid);
  };
</script>

{#if actions.length > 0}
  <div>
    <button on:click|preventDefault={toggleMenu}>⋮</button>
    {#if displayMenu}
      <ul class="menu">
        {#each actions as item}
          <li on:click={() => clickMenu(item)}>
            {item.label}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
{/if}

<style>
  div {
    display: inline-block;
  }
  button {
    border: none;
    border-radius: 15px;
    font-size: 21px;
    font-weight: bolder;
    height: 32px;
    width: 32px;
    cursor: pointer;
  }
  ul {
    position: absolute;
    top: 130px;
    left: 176px;
    padding: 0;
    color: var(--color-dark-stronger);
    background-color: var(--color-light-stronger);
    box-shadow: var(--shadow-modal);
    border: 0.3px solid var(--color-dark-stronger);
    border-bottom: 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-body);
  }
  li {
    display: block;
    cursor: pointer;
    padding: 0.2em 1em;
    border-bottom: 0.3px solid var(--color-dark-stronger);
  }
  li:hover {
    color: var(--color-primary-regular);
  }
</style>
