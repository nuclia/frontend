<script>
  export let name;
  export let size = ''; // 'small' | 'large' (medium by default)
</script>

{#if name}
  <svg
    class="sw-svg-icon {size}"
    tabindex="-1">
    <use
      xmlns:xlink="http://www.w3.org/1999/xlink"
      xlink:href="#{name}" />
  </svg>
{/if}

<style
  lang="scss"
  src="./Icon.scss"></style>
