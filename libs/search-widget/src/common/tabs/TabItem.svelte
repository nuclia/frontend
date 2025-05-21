<script>
  import { createBubbler } from 'svelte/legacy';

  const bubble = createBubbler();
  let { active, children } = $props();
</script>

<li
  class="sw-tab-item"
  role="presentation"
  class:active>
  <button
    class="link"
    role="tab"
    onclick={bubble('click')}
    aria-expanded={active}>
    <span
      class="link-wrapper ellipsis"
      tabindex="-1">
      {@render children?.()}
    </span>
  </button>
</li>

<style
  lang="scss"
  src="./TabItem.scss"></style>
