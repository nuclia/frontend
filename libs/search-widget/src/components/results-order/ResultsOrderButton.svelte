<script lang="ts">
  import { Button, Dropdown, Icon, Option } from '../../common';
  import { _, resultsOrder, type ResultsOrder } from '../../core';

  let showDropdown = false;
  let position: { top?: number; right?: number; width: number } | undefined;
  let button: HTMLElement | undefined;

  const select = (value: ResultsOrder) => {
    resultsOrder.set(value);
    showDropdown = false;
  };
  const openDropdown = () => {
    if (button) {
      const { top, right, height } = button.getBoundingClientRect();
      position = { top: top + height, right: window.innerWidth - right - 16, width: 200 };
      showDropdown = true;
    }
  };
</script>

<div class="sw-results-order">
  <div bind:this={button}>
    <Button
      aspect="basic"
      on:click={openDropdown}>
      {$_('results.order.by-' + $resultsOrder)}
      <span class="icon"><Icon name={showDropdown ? 'chevron-up' : 'chevron-down'}></Icon></span>
    </Button>
  </div>
  {#if showDropdown}
    <Dropdown
      {position}
      on:close={() => (showDropdown = false)}>
      <div>
        <Option
          selected={$resultsOrder === 'relevance'}
          on:select={() => select('relevance')}>
          {$_('results.order.by-relevance')}
        </Option>
        <Option
          selected={$resultsOrder === 'date'}
          on:select={() => select('date')}>
          {$_('results.order.by-date')}
        </Option>
      </div>
    </Dropdown>
  {/if}
</div>

<style src="./ResultsOrderButton.css"></style>
