<script>
  export let active;
</script>

<li
  class="sw-tab-item"
  role="presentation"
  class:active>
  <button
    class="link"
    role="tab"
    on:click
    aria-expanded={active}>
    <span
      class="link-wrapper ellipsis"
      tabindex="-1">
      <slot />
    </span>
  </button>
</li>

<style
  lang="scss"
  src="./TabItem.scss"></style>
