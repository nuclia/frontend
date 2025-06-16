<script lang="ts">
  interface Props {
    small?: boolean;
  }

  let { small = false }: Props = $props();
</script>

<div class="sr-only">Loading</div>
<div
  class="sw-loading-dots"
  class:small>
  <div class="bounce1"></div>
  <div class="bounce2"></div>
  <div class="bounce3"></div>
</div>

<style src="./LoadingDots.css"></style>
