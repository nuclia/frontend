<script module>
  let nextId = 0;
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  interface Props {
    checked?: boolean;
    disabled?: boolean;
    children?: import('svelte').Snippet;
  }

  let { checked = $bindable(false), disabled = false, children }: Props = $props();

  const dispatch = createEventDispatcher();
  nextId++;

  let id = $derived(`checkbox-${nextId}`);
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
    onchange={onChange} />
  {#if checked}
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="36"
      height="36"
      viewBox="0 0 36 36">
      <polygon
        points="29.021 17.021 11.021 17.021 11.021 9.021 7.021 9.021 7.021 21.021 29.021 21.021"
        transform="rotate(-45 18.02 15.02)" />
    </svg>
  {/if}
  <label for={id}>
    {@render children?.()}
  </label>
</div>

<style src="./Checkbox.css"></style>
