<script lang="ts">
  interface Props {
    small?: boolean;
    label?: string;
  }

  let { small = false, label = '' }: Props = $props();
</script>

<div class="sr-only">Loading</div>
<div
  class="sw-loading-dots"
  class:small>
  {#if label}
    <div>{label}</div>
  {/if}
  <div class="loading-dots">
    <div class="bounce1"></div>
    <div class="bounce2"></div>
    <div class="bounce3"></div>
  </div>
</div>

<style src="./LoadingDots.css"></style>
