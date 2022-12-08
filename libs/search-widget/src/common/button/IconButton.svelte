<script lang="ts">
  import Icon from '../icons/Icon.svelte';
  import { createEventDispatcher } from 'svelte';

  export let icon = '';
  export let ariaLabel = '';
  export let aspect = 'solid'; // solid or basic
  export let kind = 'secondary'; // primary | secondary | inverted
  export let size = 'medium'; // medium | small | xsmall
  export let disabled = false;

  $: iconSize = size === 'xsmall' ? 'small' : 'medium';

  const dispatch = createEventDispatcher();

  function onKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      dispatch('enter');
    }
  }
</script>

<button
  class="sw-button icon {aspect} {kind} {size}"
  type="button"
  aria-label={ariaLabel}
  tabindex="0"
  {disabled}
  on:click
  on:keyup={onKeyup}>
  <Icon
    name={icon}
    size={iconSize} />
</button>

<style
  lang="scss"
  src="./Button.scss"></style>
