<script lang="ts">
  import type { Observable } from 'rxjs';
  import { fieldData, getFieldUrl } from '../../../core';

  const imageUrl: Observable<string> = getFieldUrl();
</script>

<div class="sw-image-renderer">
  <img
    src={$imageUrl}
    alt={$fieldData?.value?.file?.filename || ''} />
</div>

<style src="./ImageRenderer.css"></style>
