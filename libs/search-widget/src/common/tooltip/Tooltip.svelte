<script>
  let { title, x, y, visible } = $props();
</script>

<div
  class="sw-tooltip"
  style:left="{x}px"
  style:top="{y}px"
  style:opacity={visible ? 1 : 0}>
  {title}
</div>

<style
  lang="scss"
  src="./Tooltip.scss"></style>
