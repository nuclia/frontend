<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Icon } from '../../common';

  export let expanded;

  const dispatch = createEventDispatcher();
  function toggleSection() {
    dispatch('toggle');
  }
</script>

<div class="sw-metadata-section-header"
     tabindex="0"
     class:expanded
     on:click={toggleSection}
     on:keyup={(e) => {if (e.key === 'Enter') toggleSection();}}>
  <div
    tabindex="-1"
    class="metadata-expander-header-title">
    <strong><slot></slot></strong>
    <div class="expander-icon">
      <Icon name="chevron-right" />
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./MetadataSectionHeader.scss"></style>
