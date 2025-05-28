<script>
  /**
   * @typedef {Object} Props
   * @property {import('svelte').Snippet} [children]
   */

  /** @type {Props} */
  let { children } = $props();
</script>

<ul
  class="sw-tabs-list"
  role="tablist">
  {@render children?.()}
</ul>

<style
  lang="scss"
  src="./TabsList.scss"></style>
