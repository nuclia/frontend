<script>
  export let title;
  export let x;
  export let y;
  export let visible;
</script>

<div class="sw-tooltip"
     style:left="{x + 16}px"
     style:top="{y + 16}px"
     style:opacity="{visible ? 1 : 0}"
>{title}</div>

<style>
  .sw-tooltip {
    background: hsl(0, 0%, 5%);
    border-radius: 2px;
    color: #fff;
    font-family: 'Source Sans Pro', sans-serif;;
    font-size: 13px;
    opacity: 0;
    padding: 4px 8px;
    position: absolute;
    transition: opacity 240ms ease-in-out;
  }
</style>
