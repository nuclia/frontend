<script lang="ts">
  import { getCDN } from '../../core/utils';
  export let type: string;
  export let small: boolean = false;

  const handleError = () => {
    type = 'application/generic';
  };
</script>

<img src={`${getCDN()}icons/${type}.svg`} alt={type} on:error={handleError} class="sw-mime" class:small />

<style lang="scss" src="./MimeIcon.scss"></style>
