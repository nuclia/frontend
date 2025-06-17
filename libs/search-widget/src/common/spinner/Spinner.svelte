<script>
  /**
   * @typedef {Object} Props
   * @property {string} [size]
   */

  /** @type {Props} */
  let { size = 'medium' } = $props();

  let sizeVar = $derived.by(() => {
    switch (size) {
      case 'small':
        return `var(--rhythm-4)`;
      case 'large':
        return `var(--rhythm-12)`;
      default:
        return '';
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
