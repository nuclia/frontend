<script lang="ts">
  export let text = '';

  $: formattedText = text.trim().replace(/\n/g, '<br>');
</script>

{@html formattedText}
