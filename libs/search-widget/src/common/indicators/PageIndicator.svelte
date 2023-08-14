<script lang="ts">
  export let page: number | undefined;
  export let hovering = false;
  export let stack = false;
  export let selected = false;
</script>

{#if typeof page === 'number'}
  <button
    class="sw-indicator sw-page-indicator"
    class:hovering
    class:selected
    class:stack>
    p. {page + 1}
  </button>
{/if}


<style
  lang="scss"
  src="./PageIndicator.scss"></style>
