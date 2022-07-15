<script lang="ts">
  import { getCDN } from '../../core/utils';
  export let type: string;
  export let small: boolean = false;

  const handleError = () => {
    type = 'application/generic';
  };
</script>

<img src={`${getCDN()}icons/${type}.svg`} alt={type} on:error={handleError} class:small />

<style>
  img.small {
    width: 24px;
    height: auto;
  }
</style>
