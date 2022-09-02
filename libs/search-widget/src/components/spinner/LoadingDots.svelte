<script lang="ts">
  export let small = false;
</script>

<div class="loading-dots" class:small>
  <div class="bounce1" />
  <div class="bounce2" />
  <div class="bounce3" />
</div>

<style>
  .loading-dots {
    align-content: center;
    display: flex;
    gap: var(--rhythm-1);
    justify-content: center;
  }

  /*Huge thanks to @tobiasahlin at http://tobiasahlin.com/spinkit/ */
  .loading-dots:not(.small) {
    margin: var(--rhythm-12) auto 0;
    text-align: center;
  }

  .loading-dots > div {
    width: var(--rhythm-2);
    height: var(--rhythm-2);
    background-color: var(--color-primary-regular);

    border-radius: 100%;
    display: inline-block;
    -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
    animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  }

  .loading-dots.small {
    gap: var(--rhythm-0_5);
  }
  .loading-dots.small > div {
    width: calc(var(--rhythm-0_5) + var(--rhythm-0_25));
    height: calc(var(--rhythm-0_5) + var(--rhythm-0_25));
  }

  .loading-dots .bounce1 {
    -webkit-animation-delay: -0.32s;
    animation-delay: -0.32s;
  }

  .loading-dots .bounce2 {
    -webkit-animation-delay: -0.16s;
    animation-delay: -0.16s;
  }

  @-webkit-keyframes sk-bouncedelay {
    0%,
    80%,
    100% {
      -webkit-transform: scale(0);
    }
    40% {
      -webkit-transform: scale(1);
    }
  }

  @keyframes sk-bouncedelay {
    0%,
    80%,
    100% {
      -webkit-transform: scale(0);
      transform: scale(0);
    }
    40% {
      -webkit-transform: scale(1);
      transform: scale(1);
    }
  }
</style>
