<script lang="ts">
  import Icon from '../../common/Icon.svelte';

  export let aspect = 'solid'; // solid or basic
  export let kind = 'secondary'; // primary | secondary | inverted
  export let size = 'medium'; // medium or small
  export let disabled = false;
</script>

<button class="sw-button icon {aspect} {kind}"
        class:small={size === 'small'}
        type="button"
        aria-label="Close"
        tabindex="0"
        {disabled}
        on:click
>
  <Icon name="cross" />
</button>

<style lang="scss" src="./Button.scss"></style>
