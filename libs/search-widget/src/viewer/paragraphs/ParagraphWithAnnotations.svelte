<script lang="ts">
  import Paragraph from './Paragraph.svelte';
  import { onDestroy, onMount } from 'svelte';

  export let text: string;

  // TODO: highlight entities in text from positions we got in FieldMetadata
  $: markedText = text;
  let contentContainer: HTMLElement;

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

  const contextMenu = (event) => {
    console.log('Context menu: TODO family dropdown');
    event.preventDefault();
  }
</script>

<Paragraph>
  <div slot="content"
       bind:this={contentContainer}>
    {@html markedText}
  </div>
</Paragraph>

<style lang="scss" src="./ParagraphWithAnnotations.scss"></style>
