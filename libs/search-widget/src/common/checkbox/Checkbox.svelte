<script lang="ts">
  import { slugify } from '../../core/utils';
  import { createEventDispatcher } from 'svelte';

  export let checked = false;

  const dispatch = createEventDispatcher();
  let labelElement: HTMLElement;

  $: id = labelElement ? slugify(labelElement.innerText) : '';
  const onChange = () => {
    dispatch('change', checked);
  };
</script>

<div class="sw-checkbox">
  <input
    {id}
    type="checkbox"
    class="sw-checkbox-control"
    bind:checked
    on:change={onChange} />
  <label
    bind:this={labelElement}
    for={id}>
    <slot />
  </label>
</div>

<style
  lang="scss"
  src="./Checkbox.scss"></style>
