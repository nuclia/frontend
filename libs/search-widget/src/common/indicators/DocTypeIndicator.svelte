<script lang="ts">
  let { type } = $props();

  let typeIndicator = $derived.by(() => {
    switch (type) {
      case 'audio':
        return 'audio';
      case 'conversation':
        return 'conv';
      case 'image':
        return 'image';
      case 'pdf':
        return 'document';
      case 'spreadsheet':
        return 'spreadsheet';
      case 'text':
        return 'text';
      case 'video':
        return 'video';
      default:
        return '';
    }
  });
</script>

<div class="sw-doc-type-indicator">
  {typeIndicator}
</div>

<style src="./DocTypeIndicator.css"></style>
