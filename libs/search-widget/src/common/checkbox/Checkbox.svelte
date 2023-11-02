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
  <label
    for={id}>
    <slot />
  </label>
</div>

<style
  lang="scss"
  src="./Checkbox.scss"></style>
