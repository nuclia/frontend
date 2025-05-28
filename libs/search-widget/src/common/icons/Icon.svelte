<script>
  /**
   * @typedef {Object} Props
   * @property {any} name
   * @property {string} [size] - 'small' | 'large' (medium by default)
   */

  /** @type {Props} */
  let { name, size = '' } = $props();
</script>

{#if name}
  <svg
    class="sw-svg-icon {size}"
    tabindex="-1">
    <use href="#{name}" />
  </svg>
{/if}

<style
  lang="scss"
  src="./Icon.scss"></style>
