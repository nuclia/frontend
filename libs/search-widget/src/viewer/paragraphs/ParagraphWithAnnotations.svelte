<script lang="ts">
  import Paragraph from './Paragraph.svelte';
  import { onDestroy, onMount } from 'svelte';
  import EntityFamilyMenu from '../menus/EntityFamilyMenu.svelte';
  import { EntityGroup, WidgetParagraph } from '../../core/models';
  import { viewerStore } from '../viewer.store';
  import { map } from 'rxjs';
  import { addAnnotation, Annotation, removeAnnotation, updateAnnotation } from '../stores/annotation.store';
  import { addEntity, nucliaStore } from '../../core/store';

  export let paragraph: WidgetParagraph;
  export let paragraphId: string;

  const entityGroups = nucliaStore().entities;
  const customEntities = viewerStore.annotations;
  const selectedFamily = viewerStore.selectedFamily;

  let isDestroyed = false;

  $: markedText = customEntities.pipe(
    map(entities => {
      let textWithMarks = '';
      let currentIndex = 0;
      entities.sort((a, b) => {
        if (a.start < b.start) {
          return -1;
        } else if (a.start > b.start) {
          return 1;
        } else {
          return 0;
        }
      }).filter(entity => entity.paragraphId === paragraphId).forEach((entity) => {
        const isHighlighted = $selectedFamily === entity.entityFamilyId;
        let highlightStyle = '';
        if (isHighlighted) {
          const family = $entityGroups.find(group => group.id === entity.entityFamilyId);
          highlightStyle = `style="background-color:${family.color}"`;
        }
        textWithMarks += `${paragraph.text.slice(currentIndex, entity.start)}<mark ${highlightStyle}
  family="${entity.entityFamilyId}"
  start="${entity.start}"
  end="${entity.end}"
  entity="${entity.entity}"
  paragraphId="${entity.paragraphId}">${paragraph.text.slice(entity.start, entity.end)}</mark>`;
        currentIndex = entity.end;
      });
      textWithMarks += paragraph.text.slice(currentIndex);

      setTimeout(() => {
        if (!isDestroyed) {
          cleanUpMarkListener();
          setupMarkListener();
        }
      });
      return textWithMarks;
    }),
  );
  let contentContainer: HTMLElement;
  let isMenuOpen = false;
  let isMenuVisible = false;
  let menuPosition;
  let menuHeight;
  let selectedText;
  let selectedEntity: Annotation | undefined;

  function setupMarkListener() {
    contentContainer.querySelectorAll('mark[family]').forEach(mark => {
      mark.addEventListener('click', clickOnEntity);
    });
  }

  function cleanUpMarkListener() {
    contentContainer.querySelectorAll('mark[family]').forEach(mark => {
      mark.removeEventListener('click', clickOnEntity);
    });
  }

  onMount(() => {
    contentContainer.addEventListener('contextmenu', contextMenu);
  });

  onDestroy(() => {
    isDestroyed = true;
    cleanUpMarkListener();
    contentContainer.removeEventListener('contextmenu', contextMenu);
  });

  const clickOnEntity = (event) => {
    selectedEntity = {
      entityFamilyId: event.target.getAttribute('family'),
      entity: event.target.getAttribute('entity'),
      paragraphId,
      start: parseInt(event.target.getAttribute('start')),
      end: parseInt(event.target.getAttribute('end')),
      paragraphStart: paragraph.start,
    };
    openMenu(event);
  };

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
  };

  function getTextSelection() {
    return !!document.querySelector('nuclia-search')?.shadowRoot?.getSelection ?
      document.querySelector('nuclia-search').shadowRoot.getSelection() :
      document.getSelection();
  }

  const contextMenu = (event: MouseEvent) => {
    const selection = getTextSelection();
    if (selection.type === 'Range') {
      event.preventDefault();
      const range = selection.getRangeAt(0);
      const highlightedText = selection.anchorNode?.textContent.slice(range.startOffset, range.endOffset);
      let start = range.startOffset;
      let end = range.endOffset;
      if (paragraph.text.slice(start, end) !== highlightedText) {
        // document.getSelection() returns text from the last tag, so if users selects text after a marked entity in the paragraph,
        // the range is relative to the last mark and not to the beginning of the paragraph.
        start = paragraph.text.indexOf(highlightedText);
        end = start + (range.endOffset - range.startOffset);
      }
      selectedText = {
        trimmedText: highlightedText.replaceAll(/\s+/ig, ' ').trim(),
        start,
        end,
      };
      openMenu(event);
    }
  };

  const selectFamily = (family: EntityGroup) => {
    if (!selectedEntity) {
      const entity = selectedText.trimmedText;
      addAnnotation({
        entityFamilyId: family.id,
        entity,
        paragraphId,
        start: selectedText.start,
        end: selectedText.end,
        paragraphStart: paragraph.start,
      });
      addEntity(entity, family);
    } else if (selectedEntity.entityFamilyId === family.id) {
      removeAnnotation(selectedEntity);
    } else {
      updateAnnotation(selectedEntity, {...selectedEntity, entityFamilyId: family.id});
    }
    closeMenu();
  };

  const closeMenu = () => {
    isMenuVisible = false;
    selectedEntity = undefined;
    setTimeout(() => {
      isMenuOpen = false;
    }, 240);
  };
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
                      selectedFamily={selectedEntity?.entityFamilyId}
                      on:menuHeight={(event) => menuHeight = event.detail.height}
                      on:familySelection={(event) => selectFamily(event.detail.family)}
                      on:close={closeMenu}></EntityFamilyMenu>
  </div>

{/if}

<style lang="scss" src="./ParagraphWithAnnotations.scss"></style>
