<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import IconButton from '../../common/button/IconButton.svelte';
  import { _ } from '../../core/i18n';

  interface Props {
    resultIndex: any;
    total: any;
    disabled?: boolean;
  }

  let { resultIndex, total, disabled = false }: Props = $props();

  let offsetWidth = $state(0);
  let containerElement: HTMLElement;
  const dispatch = createEventDispatcher();

  $effect(() => {
    dispatch('offsetWidth', { offsetWidth });
  });

  const openPrevious = () => {
    dispatch('openPrevious');
  };
  const openNext = () => {
    dispatch('openNext');
  };
</script>

{#if !!total}
  <div
    class="search-result-navigator"
    bind:offsetWidth>
    <span
      class="result-count"
      class:disabled>
      {$_('results.count', { index: resultIndex + 1, total: total })}
    </span>

    <div class="navigation-buttons">
      <IconButton
        icon="chevron-up"
        size="small"
        ariaLabel={$_('result.previous')}
        aspect="basic"
        disabled={resultIndex <= 0 || disabled}
        on:click={openPrevious} />

      <IconButton
        icon="chevron-down"
        size="small"
        ariaLabel={$_('result.next')}
        aspect="basic"
        disabled={resultIndex === total - 1 || disabled}
        on:click={openNext} />
    </div>
  </div>
{/if}

<style src="./SearchResultNavigator.css"></style>
