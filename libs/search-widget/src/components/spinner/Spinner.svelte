<script>
  export let size = 'medium';

  let sizeVar;
  $: {
    switch (size) {
      case 'small':
        sizeVar = `var(--rhythm-4)`
        break;
      case 'large':
        sizeVar = `var(--rhythm-12)`
        break;
      default:
        sizeVar = '';
    }
  }
</script>

<div class="spinner-wrapper"
     style:--inner-size="{sizeVar}">
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

<style>
  .spinner-wrapper {
    --inner-size: var(--rhythm-6);

    display: block;
    position: relative;
    height: calc(var(--inner-size) * 2);
    min-height: calc(var(--inner-size) * 2);
    width: 100%;
  }

  .spinner-wrapper .spinner {
    position: absolute;
    overflow: hidden;
    left: 50%;
    margin-left: calc(-1 * var(--inner-size));
    animation: outer-rotate 2.91667s linear infinite;
  }

  .spinner-wrapper .spinner .inner {
    animation: sporadic-rotate 5.25s cubic-bezier(0.35, 0, 0.25, 1) infinite;
    height: calc(var(--inner-size) * 2);
    position: relative;
    width: calc(var(--inner-size) * 2);
  }

  .spinner-wrapper .spinner .inner .gap {
    position: absolute;
    left: var(--inner-size);
    right: var(--inner-size);
    top: 0;
    bottom: 0;
    border-top: var(--rhythm-1_5) solid;
    box-sizing: border-box;
  }

  .spinner-wrapper .spinner .inner .left,
  .spinner-wrapper .spinner .inner .right {
    height: calc(var(--inner-size) * 2);
    position: absolute;
    overflow: hidden;
    top: 0;
    width: var(--inner-size);
  }

  .spinner-wrapper .spinner .inner .left .half-circle,
  .spinner-wrapper .spinner .inner .right .half-circle {
    border: var(--rhythm-1_5) solid var(--color-primary-regular);
    border-bottom-color: transparent;
    border-radius: 50%;
    box-sizing: border-box;
    height: calc(var(--inner-size) * 2);
    position: absolute;
    top: 0;
    width: calc(var(--inner-size) * 2);
  }

  .spinner-wrapper .spinner .inner .left {
    left: 0;
  }

  .spinner-wrapper .spinner .inner .left .half-circle {
    left: 0;
    border-right-color: transparent;
    animation: left-wobble 1.3125s cubic-bezier(0.35, 0, 0.25, 1) infinite;
  }

  .spinner-wrapper .spinner .inner .right {
    right: 0;
  }

  .spinner-wrapper .spinner .inner .right .half-circle {
    right: 0;
    border-left-color: transparent;
    animation: right-wobble 1.3125s cubic-bezier(0.35, 0, 0.25, 1) infinite;
  }

  @keyframes outer-rotate {
    0% {
      transform: rotate(0deg) scale(0.5);
    }
    100% {
      transform: rotate(360deg) scale(0.5);
    }
  }

  @keyframes left-wobble {
    0%,
    100% {
      transform: rotate(130deg);
    }
    50% {
      transform: rotate(-5deg);
    }
  }

  @keyframes right-wobble {
    0%,
    100% {
      transform: rotate(-130deg);
    }
    50% {
      transform: rotate(5deg);
    }
  }

  @keyframes sporadic-rotate {
    12.5% {
      transform: rotate(135deg);
    }
    25% {
      transform: rotate(270deg);
    }
    37.5% {
      transform: rotate(405deg);
    }
    50% {
      transform: rotate(540deg);
    }
    62.5% {
      transform: rotate(675deg);
    }
    75% {
      transform: rotate(810deg);
    }
    87.5% {
      transform: rotate(945deg);
    }
    100% {
      transform: rotate(1080deg);
    }
  }

</style>
