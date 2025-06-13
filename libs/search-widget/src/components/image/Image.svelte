<script lang="ts">
  interface Props {
    path?: string;
  }

  let { path = '' }: Props = $props();

  let expose = $state(false);

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
  onclick={toggleExpose}
  onkeypress={keypress}
  class="image"
  class:expose>
  <img src={path} />
</div>

<style src="./Image.css"></style>
