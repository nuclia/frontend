<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { slugify } from '../../core/utils';
  interface Props {
    label?: string;
    checked?: boolean;
  }

  let { label = '', checked = $bindable(false) }: Props = $props();

  let id = $derived(slugify(label));
  const dispatch = createEventDispatcher();

  const onChange = () => {
    dispatch('change', checked);
  };
</script>

<label
  for={id}
  class="sw-toggle">
  {label}
  <div class="switch">
    <input
      {id}
      type="checkbox"
      bind:checked
      onchange={onChange} />
    <span class="slider"></span>
  </div>
</label>

<style
  lang="scss"
  src="./Toggle.scss"></style>
