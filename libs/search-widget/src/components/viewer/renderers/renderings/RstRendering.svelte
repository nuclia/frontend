<script lang="ts">
  export let text = '';

  // TODO render formatted RST
  $: formattedText = text.trim().replace(/\n/g, '<br>');
</script>

{@html formattedText}
