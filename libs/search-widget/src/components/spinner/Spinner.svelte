<script lang="ts">
  export let small = false;
  export let single = false;
</script>

<div class="spinner" class:small class:single>
  {#if !single}
    <div class="bounce1" />
    <div class="bounce2" />
  {/if}
  <div class="bounce3" />
</div>

<style>
  /*Huge thanks to @tobiasahlin at http://tobiasahlin.com/spinkit/ */
  .spinner:not(.small):not(.single) {
    margin: 100px auto 0;
    width: 70px;
    text-align: center;
  }

  .spinner.small {
    width: 44px;
  }

  .spinner.single {
    width: auto;
  }

  .spinner > div {
    width: 18px;
    height: 18px;
    background-color: var(--color-neutral-strong);

    border-radius: 100%;
    display: inline-block;
    -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;
    animation: sk-bouncedelay 1.4s infinite ease-in-out both;
  }

  .spinner.small > div {
    width: 12px;
    height: 12px;
  }

  .spinner .bounce1 {
    -webkit-animation-delay: -0.32s;
    animation-delay: -0.32s;
  }

  .spinner .bounce2 {
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
