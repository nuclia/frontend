<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let items: { id: string; label: string }[] = [{ id: 'root', label: 'All' }];

  const dispatch = createEventDispatcher();
</script>

<ul>
  {#each items as item}
    <li on:click={() => dispatch('click', item.id)}>
      <span>/</span>
      {item.label}
    </li>
  {/each}
</ul>

<style
  lang="scss"
  src="./Breadcrumbs.scss"></style>
