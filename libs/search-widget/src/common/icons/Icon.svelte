<script>
  export let name;
  export let size = ''; // 'small' | 'large' (medium by default)
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
