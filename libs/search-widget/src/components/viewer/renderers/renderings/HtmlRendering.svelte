<script lang="ts">
  import TurnDownService from 'turndown';
  import MarkdownRenderer from './MarkdownRendering.svelte';
  import { createEventDispatcher } from 'svelte';

  interface Props {
    text?: string;
  }

  let { text = '' }: Props = $props();

  const turnDownService = new TurnDownService();
  let trimmedText = $derived(text.trim());
  let markdown = $derived(turnDownService.turndown(trimmedText));

  const dispatch = createEventDispatcher();
</script>

<MarkdownRenderer
  text={markdown}
  on:setElement />
