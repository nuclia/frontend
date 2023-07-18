<script lang="ts">
  export let type;

  let typeIndicator = '';
  switch (type) {
    case 'audio':
      typeIndicator = 'audio'
      break;
    case 'conversation':
      typeIndicator = 'conv';
      break;
    case 'image':
      typeIndicator = 'image';
      break;
    case 'pdf':
      typeIndicator = 'pdf';
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
</script>

<div class="sw-doc-type-indicator">
  {typeIndicator}
</div>

<style
  lang="scss"
  src="./DocTypeIndicator.scss"></style>
