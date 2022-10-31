<script lang="ts">
  import { SmartResult } from '../../core/old-stores/main.store';

  export let result: SmartResult | undefined = undefined;

  const title = result?.resource?.title || '';
  const matches = result?.textElements || [];
</script>

<div class="sw-html-tile">
  <h3>{title}</h3>
  <ul>
    {#each matches as match}
      <li class:semantic={match.isSemanticMatch}>{@html match.text}</li>
    {/each}
  </ul>
</div>

<style lang="scss" src="./HtmlTile.scss"></style>
