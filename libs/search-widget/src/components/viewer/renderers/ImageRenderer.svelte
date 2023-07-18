<script lang="ts">
  import { fieldData, getFieldUrl } from '../../../core';
  import type { Observable } from 'rxjs';

  const imageUrl: Observable<string> = getFieldUrl();
</script>

<div class="sw-image-renderer">
  <img src={$imageUrl} alt={$fieldData?.value?.file?.filename || ''} />
</div>

<style
  lang="scss"
  src="./ImageRenderer.scss"></style>
