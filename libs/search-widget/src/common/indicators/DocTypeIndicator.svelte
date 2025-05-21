<script lang="ts">
  import { run } from 'svelte/legacy';

  let { type } = $props();

  let typeIndicator = $state('');
  run(() => {
    switch (type) {
      case 'audio':
        typeIndicator = 'audio';
        break;
      case 'conversation':
        typeIndicator = 'conv';
        break;
      case 'image':
        typeIndicator = 'image';
        break;
      case 'pdf':
        typeIndicator = 'document';
        break;
      case 'spreadsheet':
        typeIndicator = 'spreadsheet';
        break;
      case 'text':
        typeIndicator = 'text';
        break;
      case 'video':
        typeIndicator = 'video';
        break;
    }
  });
</script>

<div class="sw-doc-type-indicator">
  {typeIndicator}
</div>

<style
  lang="scss"
  src="./DocTypeIndicator.scss"></style>
