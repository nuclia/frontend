<script lang="ts">
  interface Props {
    page: number | undefined;
    hovering?: boolean;
    stack?: boolean;
    selected?: boolean;
  }

  let { page, hovering = false, stack = false, selected = false }: Props = $props();
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
