<script lang="ts">
  export let page = 0;
  export let hovering = false;
</script>

<div class="sw-indicator sw-page-indicator" class:hovering>
  p. {page || 0}
</div>

<style lang="scss" src="./PageIndicator.scss"></style>
