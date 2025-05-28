<script lang="ts">
  import { IconButton } from '../../common';
  import { createEventDispatcher } from 'svelte';
  import { _ } from '../../core';
  import MetadataSectionHeader from './MetadataSectionHeader.svelte';

  let { expanded, sectionId, sectionTitle, sectionContent } = $props();

  const dispatch = createEventDispatcher();
  let metadataContentHeight = $state(0);

  function toggleSection() {
    dispatch('toggle', sectionId);
  }
</script>

<div
  class="sw-metadata-container"
  class:expanded>
  <MetadataSectionHeader
    {expanded}
    on:toggle={toggleSection}>
    {@render sectionTitle?.()}
  </MetadataSectionHeader>

  <div
    class="metadata-expander-content"
    style:--content-height="{metadataContentHeight}px">
    <div class="metadata-header">
      <h3 class="title-m">{@render sectionTitle?.()}</h3>
      <IconButton
        icon="cross"
        aspect="basic"
        ariaLabel={$_('generic.close')}
        on:click={toggleSection}></IconButton>
    </div>
    <div
      class="metadata-content"
      bind:offsetHeight={metadataContentHeight}>
      {@render sectionContent?.()}
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./MetadataContainer.scss"></style>
