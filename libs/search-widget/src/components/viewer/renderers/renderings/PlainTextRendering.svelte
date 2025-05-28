<script lang="ts">
  interface Props {
    text?: string;
  }

  let { text = '' }: Props = $props();

  let formattedText = $derived(text.trim().replace(/\n/g, '<br>'));
</script>

{@html formattedText}
