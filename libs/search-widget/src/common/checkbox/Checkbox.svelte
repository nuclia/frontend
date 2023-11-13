<script context="module">
  let nextId = 0;
</script>
<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  export let checked = false;
  export let disabled = false;

  const dispatch = createEventDispatcher();
  nextId++;

  $: id = `checkbox-${nextId}`;
  const onChange = () => {
    dispatch('change', checked);
  };
</script>

<div
  class="sw-checkbox"
  class:disabled>
  <input
    {id}
    type="checkbox"
    class="sw-checkbox-control"
    {disabled}
    bind:checked
    on:change={onChange} />
  {#if checked}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 36 36">
      <polygon
        points="29.021 17.021 11.021 17.021 11.021 9.021 7.021 9.021 7.021 21.021 29.021 21.021"
        transform="rotate(-45 18.02 15.02)"/>
    </svg>
  {/if}
  <label
    for={id}>
    <slot />
  </label>
</div>

<style
  lang="scss"
  src="./Checkbox.scss"></style>
