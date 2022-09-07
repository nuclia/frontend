<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  export let label = '';
  export let checked = false;

  const dispatch = createEventDispatcher();

  const onChange = () => {
    dispatch('change', checked);
  };
</script>

<label class="sw-toggle">
  {label}
  <div class="switch">
    <input type="checkbox" bind:checked on:change={onChange} />
    <span class="slider" />
  </div>
</label>
