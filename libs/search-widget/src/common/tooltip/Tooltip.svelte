<script>
  export let title;
  export let x;
  export let y;
  export let visible;
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
