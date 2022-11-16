<script lang="ts">
  import Paragraph from './Paragraph.svelte';
  import { onDestroy, onMount } from 'svelte';
  import EntityFamilyMenu from '../menus/EntityFamilyMenu.svelte';
  import { EntityGroup, WidgetParagraph } from '../../../core/models';
  import { Duration } from '../../../common/transition.utils';
  import {
    addAnnotation,
    Annotation,
    removeAnnotation,
    selectedFamily,
    sortedAnnotations,
    updateAnnotation,
  } from '../../../core/stores/annotation.store';
  import { addEntity, entityGroups } from '../../../core/stores/entities.store';
  import { map } from 'rxjs';
  import { lengthUnicode, sliceUnicode } from '@nuclia/core';

  export let paragraph: WidgetParagraph;
  export let paragraphId: string;

  let isDestroyed = false;

  $: markedText = sortedAnnotations.pipe(
    map((entities) => {
      let textWithMarks = '';
      let currentIndex = 0;
      entities
        .filter((entity) => entity.paragraphId === paragraphId)
        .forEach((entity) => {
          const isHighlighted = $selectedFamily === entity.entityFamilyId;
          let highlightStyle = '';
          if (isHighlighted) {
            const family = entityGroups.value.find((group) => group.id === entity.entityFamilyId);
            highlightStyle = `style="background-color:${family.color}"`;
          }
          textWithMarks += `${sliceUnicode(paragraph.text, currentIndex, entity.start)}<mark ${highlightStyle}
  family="${entity.entityFamilyId}"
  start="${entity.start}"
  end="${entity.end}"
  entity="${entity.entity}"
  paragraphId="${entity.paragraphId}">${sliceUnicode(paragraph.text, entity.start, entity.end)}</mark>`;
          currentIndex = entity.end;
        });
      textWithMarks += sliceUnicode(paragraph.text, currentIndex);

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
    contentContainer.querySelectorAll('mark[family]').forEach((mark) => {
      mark.addEventListener('click', clickOnEntity);
    });
  }

  function cleanUpMarkListener() {
    contentContainer.querySelectorAll('mark[family]').forEach((mark) => {
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
    return !!document.querySelector('nuclia-search')?.shadowRoot?.getSelection
      ? document.querySelector('nuclia-search').shadowRoot.getSelection()
      : document.getSelection();
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
        trimmedText: highlightedText.replaceAll(/\s+/gi, ' ').trim(),
        start,
        end,
      };
      openMenu(event);
    }
  };

  const selectFamily = (family: EntityGroup) => {
    if (!selectedEntity) {
      const entity = selectedText.trimmedText;
      const before = paragraph.text.slice(0, selectedText.start);
      const beforeDelta = before.length - lengthUnicode(before);
      const selection = paragraph.text.slice(selectedText.start, selectedText.end);
      const selectionDelta = selection.length - lengthUnicode(selection);
      const start = selectedText.start - beforeDelta;
      const end = selectedText.end - beforeDelta - selectionDelta;
      addAnnotation({
        entityFamilyId: family.id,
        entity,
        paragraphId,
        start,
        end,
        paragraphStart: paragraph.start,
      });
      addEntity(entity, family);
    } else if (selectedEntity.entityFamilyId === family.id) {
      removeAnnotation(selectedEntity);
    } else {
      updateAnnotation(selectedEntity, { ...selectedEntity, entityFamilyId: family.id });
    }
    closeMenu();
  };

  const closeMenu = () => {
    isMenuVisible = false;
    selectedEntity = undefined;
    setTimeout(() => {
      isMenuOpen = false;
    }, Duration.FAST);
  };
</script>

<Paragraph>
  <div
    slot="content"
    bind:this={contentContainer}>
    {@html $markedText}
  </div>
</Paragraph>

{#if isMenuOpen}
  <div
    class="menu-container"
    style:opacity={isMenuVisible ? 1 : 0}>
    <EntityFamilyMenu
      position={menuPosition}
      selectedFamily={selectedEntity?.entityFamilyId}
      on:menuHeight={(event) => (menuHeight = event.detail.height)}
      on:familySelection={(event) => selectFamily(event.detail.family)}
      on:close={closeMenu} />
  </div>
{/if}

<style
  lang="scss"
  src="./ParagraphWithAnnotations.scss"></style>
