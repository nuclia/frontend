<script lang="ts">
  import { IconButton } from '../../common';
  import { createEventDispatcher } from 'svelte';
  import { _ } from '../../core';
  import MetadataSectionHeader from './MetadataSectionHeader.svelte';

  export let expanded;
  export let sectionId;

  const dispatch = createEventDispatcher();
  let metadataContentHeight = 0;

  function toggleSection() {
    dispatch('toggle', sectionId);
  }
</script>

<div class="sw-metadata-container"
     class:expanded>
  <MetadataSectionHeader {expanded}
                         on:toggle={toggleSection}>
    <slot name="sectionTitle"></slot>
  </MetadataSectionHeader>

  <div class="metadata-expander-content"
       style:--content-height="{metadataContentHeight}px">
    <div class="metadata-header">
      <h3 class="title-m"><slot name="sectionTitle"></slot></h3>
      <IconButton icon="cross"
                  aspect="basic"
                  ariaLabel={$_('generic.close')}
                  on:click={toggleSection}></IconButton>
    </div>
    <div class="metadata-content"
         bind:offsetHeight={metadataContentHeight}>
      <slot name="sectionContent"></slot>
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./MetadataContainer.scss"></style>
