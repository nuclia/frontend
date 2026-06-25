<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { createBubbler } from 'svelte/legacy';
  import Icon from '../icons/Icon.svelte';

  const bubble = createBubbler();
  interface Props {
    icon?: string;
    ariaLabel?: string;
    aspect?: string; // solid or basic
    kind?: string; // primary | secondary
    size?: string; // medium | small | xsmall
    disabled?: boolean;
    active?: boolean;
    tabIndex?: number;
    ariaHidden?: boolean;
  }

  let {
    icon = '',
    ariaLabel = '',
    aspect = 'solid',
    kind = 'secondary',
    size = 'medium',
    disabled = false,
    active = false,
    tabIndex = undefined,
    ariaHidden = undefined,
  }: Props = $props();

  let iconSize = $derived(size === 'xsmall' ? 'small' : 'medium');

  const dispatch = createEventDispatcher();

  function onKeyup(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      dispatch('enter');
    }
  }
</script>

<button
  class="sw-button icon {aspect} {kind} {size}"
  class:active
  type="button"
  aria-label={ariaLabel || undefined}
  aria-hidden={ariaHidden || undefined}
  tabindex={tabIndex ?? undefined}
  {disabled}
  onclick={bubble('click')}
  onkeyup={onKeyup}>
  <Icon
    name={icon}
    size={iconSize} />
</button>

<style src="./Button.css"></style>
