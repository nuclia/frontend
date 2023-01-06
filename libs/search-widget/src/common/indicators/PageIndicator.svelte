<script lang="ts">
  export let page = 0;
  export let hovering = false;
  export let stack = false;
  export let selected = false;
</script>

<div
  class="sw-indicator sw-page-indicator"
  class:hovering
  class:selected
  class:stack>
  p. {page || '–'}
</div>

<style
  lang="scss"
  src="./PageIndicator.scss"></style>
