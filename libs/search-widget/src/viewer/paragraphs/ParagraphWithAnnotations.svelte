<script lang="ts">
  import Paragraph from './Paragraph.svelte';
  import { onDestroy, onMount } from 'svelte';
  import EntityFamilyMenu from '../menus/EntityFamilyMenu.svelte';

  export let text: string;

  // TODO: highlight entities in text from positions we got in FieldMetadata
  $: markedText = text;
  let contentContainer: HTMLElement;
  let isMenuOpen = false;
  let menuPosition;
  let selectedText;

  onMount(() => {
    contentContainer.addEventListener('contextmenu', contextMenu);
    contentContainer.querySelectorAll('mark[family]').forEach(mark => {
      mark.addEventListener('click', clickOnEntity);
    });
  });

  onDestroy(() => {
    contentContainer.querySelectorAll('mark[family]').forEach(mark => {
      mark.removeEventListener('click', clickOnEntity);
    });
    contentContainer.removeEventListener('contextmenu', contextMenu);
  });

  const clickOnEntity = (event) => {
    console.log('Click: TODO select', event);
  }

  const contextMenu = (event: MouseEvent) => {
    const selection = document.getSelection();
    if (selection.type === 'Range') {
      selectedText = getCleanedUpSelectedText(selection);
      event.preventDefault();
      menuPosition = {
        left: event.layerX + 32 + (selection.focusOffset - selection.anchorOffset),
        top: event.layerY + 32,
      };
      isMenuOpen = true;
    }
  }

  const selectFamily = (family: string) => {
    // TODO
    console.log('selectFamily', family, selectedText);
  }

  function getCleanedUpSelectedText(selection: Selection) {
    return selection.anchorNode?.textContent.substring(selection.anchorOffset, selection.focusOffset).replaceAll(/\s+/ig, ' ');
  }
</script>

<Paragraph>
  <div slot="content"
       bind:this={contentContainer}>
    {@html markedText}
  </div>
</Paragraph>

{#if isMenuOpen}
  <EntityFamilyMenu position={menuPosition}
                    on:familySelection={(event) => selectFamily(event.detail.family)}
                    on:close={() => isMenuOpen = false}></EntityFamilyMenu>
{/if}

<style lang="scss" src="./ParagraphWithAnnotations.scss"></style>
