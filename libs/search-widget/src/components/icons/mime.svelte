<script lang="ts">
  import { getCDN } from '../../core/utils';
  export let type: string;
  export let size: 'small' | 'normal' = 'normal';

  const handleError = () => {
    type = 'application/generic';
  };
</script>

<img src={`${getCDN()}icons/${type}.svg`} alt={type} on:error={handleError} class={size} />

<style>
  img.small {
    width: 24px;
    height: auto;
  }
</style>
