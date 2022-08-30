<script>
  import {getCDN} from '../core/utils';

  export let name;
  export let size; // 'small' | 'large' (medium by default)
</script>

{#if name}
  <svg class="svg-icon {size}"
       tabindex="-1">
    <use xlink:href="{`${getCDN()}icons/glyphs-sprite.svg#${name}`}"></use>
  </svg>
{/if}

<style>
  .svg-icon {
    fill: currentColor;
    height: var(--rhythm-3);
    width: var(--rhythm-3);
  }
  .svg-icon.small {
    height: var(--rhythm-2);
    width: var(--rhythm-2);
  }
  .svg-icon.large {
    height: var(--rhythm-5);
    width: var(--rhythm-5);
  }
  .svg-icon:focus {
    outline: 0;
  }
</style>
