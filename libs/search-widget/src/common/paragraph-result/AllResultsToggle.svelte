<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '../icons/Icon.svelte';

  interface Props {
    showAllResults?: boolean;
  }

  let { showAllResults = false }: Props = $props();

  const dispatch = createEventDispatcher();
  const toggle = (event: MouseEvent) => {
    event.stopPropagation();
    dispatch('toggle');
  };
</script>

<div
  class="all-result-toggle"
  class:expanded={showAllResults}
  onclick={toggle}>
  Display {showAllResults ? 'less' : 'all'} results

  <div class="icon">
    <Icon
      name="chevron-right"
      size="small" />
  </div>
</div>

<style
  lang="scss"
  src="./AllResultsToggle.scss"></style>
