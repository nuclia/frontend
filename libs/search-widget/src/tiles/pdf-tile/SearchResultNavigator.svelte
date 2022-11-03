<script lang="ts">
import IconButton from '../../common/button/IconButton.svelte';
import { _ } from '../../core/i18n';
import { createEventDispatcher } from 'svelte';

export let resultIndex;
export let total;

let offsetWidth = 0;
let containerElement: HTMLElement;
const dispatch = createEventDispatcher();

$: {
  dispatch('offsetWidth', {offsetWidth})
}

const openPrevious = () => {
  dispatch('openPrevious');
}
const openNext = () => {
  dispatch('openNext');
}
</script>

<div class="search-result-navigator"
     bind:offsetWidth={offsetWidth}>
  <span class="result-count">{$_('results.count', { index: resultIndex + 1, total: total })}</span>

  <div class="navigation-buttons">
    <IconButton icon="chevron-up"
                size="small"
                ariaLabel="{$_('result.previous')}"
                aspect="basic"
                disabled={resultIndex === 0}
                on:click={openPrevious}></IconButton>

    <IconButton icon="chevron-down"
                size="small"
                ariaLabel="{$_('result.next')}"
                aspect="basic"
                disabled={resultIndex === total - 1}
                on:click={openNext}></IconButton>
  </div>
</div>

<style lang="scss" src="./SearchResultNavigator.scss"></style>
