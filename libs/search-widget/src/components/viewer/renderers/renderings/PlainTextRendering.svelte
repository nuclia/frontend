<script lang="ts">
  import DOMPurify from 'dompurify';

  interface Props {
    text?: string;
  }

  let { text = '' }: Props = $props();

  let formattedText = $derived(DOMPurify.sanitize(text.trim().replace(/\n/g, '<br>')));
</script>

{@html formattedText}
