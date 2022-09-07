<script>
  export let size = 'medium';

  let sizeVar;
  $: {
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
  }
</script>

<div class="sw-spinner-wrapper" style:--inner-size={sizeVar}>
  <div class="spinner">
    <div class="inner">
      <div class="gap" />
      <div class="left">
        <div class="half-circle" />
      </div>
      <div class="right">
        <div class="half-circle" />
      </div>
    </div>
  </div>
</div>
