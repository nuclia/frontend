<script lang="ts">
  import Paragraph from './Paragraph.svelte';
  import { onDestroy, onMount } from 'svelte';
  import EntityFamilyMenu from '../menus/EntityFamilyMenu.svelte';
  import { WidgetParagraph } from '../../core/models';
  import { viewerStore } from '../viewer.store';
  import { map } from 'rxjs';

  export let paragraph: WidgetParagraph;
  export let paragraphId: string;

  const customEntities = viewerStore.customEntities;

  $: markedText = customEntities.pipe(map(entities => {
    let textWithMarks = '';
    let currentIndex = 0;
    entities.filter(entity => entity.paragraphId === paragraphId).forEach((entity) => {
      textWithMarks += `${paragraph.text.slice(currentIndex, entity.start)}<mark family="${entity.entityFamilyId}">${paragraph.text.slice(entity.start, entity.end)}</mark>`;
      currentIndex = entity.end;
    });
    textWithMarks += paragraph.text.slice(currentIndex);
    return textWithMarks;
  }));
  let contentContainer: HTMLElement;
  let isMenuOpen = false;
  let isMenuVisible = false;
  let menuPosition;
  let menuHeight;
  let selectedText;
  let currentEntityFamily;

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
    currentEntityFamily = event.target.getAttribute('family');
    openMenu(event);
  }

  const openMenu = (event: MouseEvent) => {
    isMenuOpen = true;
    setTimeout(() => {
      const delta = window.screen.availHeight - (event.clientY + menuHeight);
      const top = delta < 80 ? event.clientY - menuHeight : event.clientY - 80;
      menuPosition = {
        left: event.clientX - 96,
        top,
      };
      isMenuVisible = true;
    });
  }

  const contextMenu = (event: MouseEvent) => {
    const selection = document.getSelection();
    if (selection.type === 'Range') {
      selectedText = {
        cleanedText: getCleanedUpSelectedText(selection),
        start: selection.anchorOffset,
        end: selection.focusOffset,
      };
      event.preventDefault();
      openMenu(event);
    }
  }

  const selectFamily = (family: string) => {
    // TODO
    console.log('selectFamily', family, selectedText);
  }

  const closeMenu = () => {
    isMenuVisible = false;
    setTimeout(() => {
      isMenuOpen = false;
    }, 240);
  }

  function getCleanedUpSelectedText(selection: Selection) {
    return selection.anchorNode?.textContent.substring(selection.anchorOffset, selection.focusOffset).replaceAll(/\s+/ig, ' ').trim();
  }
</script>

<Paragraph>
  <div slot="content"
       bind:this={contentContainer}>
    {@html $markedText}
  </div>
</Paragraph>

{#if isMenuOpen}
  <div class="menu-container"
       style:opacity={isMenuVisible ? 1 : 0}>
    <EntityFamilyMenu position={menuPosition}
                      selectedFamily={currentEntityFamily}
                      on:menuHeight={(event) => menuHeight = event.detail.height}
                      on:familySelection={(event) => selectFamily(event.detail.family)}
                      on:close={closeMenu}></EntityFamilyMenu>
  </div>

{/if}

<style lang="scss" src="./ParagraphWithAnnotations.scss"></style>
