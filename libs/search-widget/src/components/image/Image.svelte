<script lang="ts">
  export let path = '';

  let expose = false;

  function toggleExpose() {
    expose = !expose;
  }

  function keypress(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      toggleExpose();
    }
  }
</script>

<div
  on:click={toggleExpose}
  on:keypress={keypress}
  class="image"
  class:expose>
  <img src={path} />
</div>

<style
  lang="scss"
  src="./Image.scss"></style>
