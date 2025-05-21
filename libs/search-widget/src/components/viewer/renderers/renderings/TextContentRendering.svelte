<script lang="ts">
  import { run } from 'svelte/legacy';

  import { Observable, of, switchMap } from 'rxjs';
  import { fieldData, getTextFile } from '../../../../core';
  import type { FileField, Search, TextField } from '@nuclia/core';
  import MarkdownRenderer from './MarkdownRendering.svelte';
  import HtmlRenderer from './HtmlRendering.svelte';
  import { getUnMarked } from '../../utils';

  interface Props {
    selectedParagraph: Search.FindParagraph | undefined;
    isHtml: boolean;
  }

  let { selectedParagraph, isHtml }: Props = $props();

  let bodyElement: HTMLElement = $state();
  const nonWords = new RegExp(/\W/g);

  let body: Observable<string> = fieldData.pipe(
    switchMap((data) => {
      const uri = (data?.value as FileField).file?.uri;
      if (uri) {
        return getTextFile(uri);
      } else {
        return of((data?.value as TextField).body || data?.extracted?.text?.text || '');
      }
    }),
  );

  function setElement(element) {
    bodyElement = element;
  }

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
        child.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        child.classList.add('highlight');
        found = true;
      } else {
        child.classList.remove('highlight');
      }
    }
  }
  run(() => {
    !!selectedParagraph && bodyElement && highlightSelection();
  });
</script>

<div class="sw-text-rendering">
  {#if isHtml}
    <HtmlRenderer
      text={$body}
      on:setElement={(event) => setElement(event.detail)} />
  {:else}
    <MarkdownRenderer
      text={$body}
      on:setElement={(event) => setElement(event.detail)} />
  {/if}
</div>

<!-- Style is the same for both TextContentRendering and ExtractedTextRendering, so the class is defined in _global.scss -->
