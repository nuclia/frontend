<script lang="ts">
  export let darkBackground = false;
</script>

<svg
  class="sw-search-icon"
  tabindex="0"
  on:keyup
  on:click
  width="24"
  height="24"
  viewBox="0 0 24 24"
  fill="none"
  xmlns="http://www.w3.org/2000/svg"
>
  <path
    d="m20 18.591-3.32-3.32a6.891 6.891 0 0 0 1.408-4.227A7.003 7.003 0 0 0 11.044 4 7 7 0 0 0 4 11.044a7 7 0 0 0 7.044 7.044 6.891 6.891 0 0 0 4.226-1.409L18.591 20 20 18.591ZM6.013 11.044a4.982 4.982 0 0 1 5.031-5.031 4.982 4.982 0 0 1 5.032 5.031 4.98 4.98 0 0 1-5.032 5.032 4.98 4.98 0 0 1-5.031-5.032Z"
    fill="var({darkBackground ? '--color-light-stronger' : '--color-dark-stronger'}"
  />
</svg>

<style lang="scss" src="./search.scss"></style>
