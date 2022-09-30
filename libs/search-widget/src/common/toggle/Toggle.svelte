<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { slugify } from '../../core/utils';
  export let label = '';
  export let checked = false;

  $: id = slugify(label);
  const dispatch = createEventDispatcher();

  const onChange = () => {
    dispatch('change', checked);
  };
</script>

<label for={id} class="sw-toggle">
  {label}
  <div class="switch">
    <input {id} type="checkbox" bind:checked on:change={onChange} />
    <span class="slider" />
  </div>
</label>

<style lang="scss" src="./Toggle.scss"></style>
