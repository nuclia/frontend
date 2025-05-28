<script lang="ts">
  interface Props {
    text?: string;
  }

  let { text = '' }: Props = $props();

  // TODO render formatted RST
  let formattedText = $derived(text.trim().replace(/\n/g, '<br>'));
</script>

{@html formattedText}
