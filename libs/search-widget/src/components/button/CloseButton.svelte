<script lang="ts">
  export let aspect = 'solid'; // solid or basic
  export let size = 'medium'; // medium or small
  export let disabled = false;
</script>

<button class="button icon {aspect}"
        class:small={size === 'small'}
        type="button"
        aria-label="Close"
        tabindex="0"
        {disabled}
        on:click
>
  <svg tabindex="-1"
       width="24"
       height="24"
       viewBox="0 0 24 24"
       xmlns="http://www.w3.org/2000/svg"
  >
    <path fill-rule="evenodd" d="m12 13.414 6.293 6.293 1.414-1.414L13.414 12l6.293-6.293-1.414-1.414L12 10.586 5.707 4.293 4.293 5.707 10.586 12l-6.293 6.293 1.414 1.414L12 13.414Z"/>
  </svg>
</button>

<style>
  @import "button.css";
</style>
