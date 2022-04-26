<script lang="ts">
  import { getCDN } from '../../core/utils';
  export let type: string;

  const handleError = () => {
    type = 'application/generic';
  };
</script>

<img src={`${getCDN()}icons/${type}.svg`} alt={type} on:error={handleError} />
