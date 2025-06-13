<script>
  import { run } from 'svelte/legacy';

  /**
   * @typedef {Object} Props
   * @property {string} [size]
   */

  /** @type {Props} */
  let { size = 'medium' } = $props();

  let sizeVar = $state();
  run(() => {
    switch (size) {
      case 'small':
        sizeVar = `var(--rhythm-4)`;
        break;
      case 'large':
        sizeVar = `var(--rhythm-12)`;
        break;
      default:
        sizeVar = '';
    }
  });
</script>

<div
  class="sw-spinner-wrapper"
  style:--inner-size={sizeVar}>
  <div class="spinner">
    <div class="inner">
      <div class="gap"></div>
      <div class="left">
        <div class="half-circle"></div>
      </div>
      <div class="right">
        <div class="half-circle"></div>
      </div>
    </div>
  </div>
</div>

<style src="./Spinner.css"></style>
