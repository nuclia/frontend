<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Icon } from '../../common';

  let { expanded, children } = $props();

  const dispatch = createEventDispatcher();
  function toggleSection() {
    dispatch('toggle');
  }
</script>

<div
  class="sw-metadata-section-header"
  tabindex="0"
  class:expanded
  onclick={toggleSection}
  onkeyup={(e) => {
    if (e.key === 'Enter') toggleSection();
  }}>
  <div
    tabindex="-1"
    class="metadata-expander-header-title">
    <strong>{@render children?.()}</strong>
    <div class="expander-icon">
      <Icon name="chevron-right" />
    </div>
  </div>
</div>

<style
  lang="scss"
  src="./MetadataSectionHeader.scss"></style>
