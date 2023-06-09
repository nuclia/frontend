<script lang="ts">
  import TurnDownService from 'turndown';
  import MarkdownRenderer from './MarkdownRenderer.svelte';
  import { createEventDispatcher } from 'svelte';

  export let text = '';

  const turnDownService = new TurnDownService();
  $: trimmedText = text.trim();
  $: markdown = turnDownService.turndown(trimmedText);

  const dispatch = createEventDispatcher();
</script>

<MarkdownRenderer
  text={markdown}
  on:setElement />
