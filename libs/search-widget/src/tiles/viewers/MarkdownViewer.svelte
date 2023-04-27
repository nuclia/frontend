<script lang="ts">
  import type { Observable } from 'rxjs';
  import { map } from 'rxjs';
  import { fieldData } from '../../core/stores/viewer.store';
  import type { WidgetParagraph } from '../../core/models';
  import type { TextField } from '@nuclia/core';
  import { getUnMarked } from '../tile.utils';

  export let selectedParagraph: WidgetParagraph | undefined;

  let bodyElement: HTMLElement;
  const nonWords = new RegExp(/\W/g);

  $: !!selectedParagraph && bodyElement && highlightSelection();

  // TODO: also support file field containing a .md
  let body: Observable<string> = fieldData.pipe(map((data) => (data?.value as TextField)?.body));

  let markedLoaded = false;
  const onMarkedLoaded = () => {
    markedLoaded = true;
  };

  function highlightSelection() {
    if (!selectedParagraph) {
      return;
    }
    let found = false;
    const textToSelect = getUnMarked(selectedParagraph.text).replace(nonWords, ' ').trim();
    const children = bodyElement.querySelectorAll('*');
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const textContent = (child.textContent || '').replace(nonWords, ' ').trim();
      // We just try to find the first matching element.
      // Ideally we would love to highlight the entire text, but the way paragraphs are extracted
      // does not match the initial Markdown structure, nor the final HTML structure
      if (!found && textContent && textToSelect.includes(textContent)) {
        child.scrollIntoView({ behavior: 'smooth' });
        child.classList.add('highlight');
        found = true;
      } else {
        child.classList.remove('highlight');
      }
    }
  }
</script>

<svelte:head>
  <script
    src="https://cdn.jsdelivr.net/npm/marked/marked.min.js"
    on:load={onMarkedLoaded}></script>
</svelte:head>

<div class="sw-markdown-viewer">
  {#if markedLoaded}
    {#if $body}
      <div bind:this={bodyElement}>{@html marked.parse($body)}</div>
    {/if}
  {/if}
</div>

<style
  lang="scss"
  src="./MarkdownViewer.scss"></style>
