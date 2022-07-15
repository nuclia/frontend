<script lang="ts">
  import type { WidgetAction } from '../core/models';
  import { getWidgetActions } from '../core/store';
  import { getCDN } from '../core/utils';

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
    <button on:click|preventDefault={toggleMenu}>
      <img src={`${getCDN()}icons/more-vertical.svg`} alt="more" >
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

<style>
  div {
    position: relative;
    display: inline-block;
  }
  button {
    border: none;
    border-radius: 50%;
    height: 32px;
    width: 32px;
    padding: 0;
    cursor: pointer;
    background: none;
    transition: background-color 0.2s;
    text-align: center;
  }
  button:hover {
    background-color: var(--color-dark-light);
  }
  ul {
    position: absolute;
    top: 4px;
    right: 24px;
    padding: 0;
    background-color: var(--color-light-stronger);
    box-shadow: var(--shadow-modal);
    border-bottom: 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-body);
  }
  li {
    display: block;
    cursor: pointer;
    padding: 0.5em 1.25em;
    font-weight: var(--font-weight-semi-bold);
    white-space: nowrap;
  }
  li:hover {
    background-color: var(--color-dark-light);
  }
  li.destructive {
    border-top: 1px solid var(--color-dark-light);
    border-bottom: 1px solid var(--color-dark-light);
    color: var(--color-secondary-stronger);
  }
  li.destructive:hover {
    background-color: var(--color-secondary-lightest);
  }
</style>
