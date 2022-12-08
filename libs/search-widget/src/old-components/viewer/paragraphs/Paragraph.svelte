<script lang="ts">
  import { ParagraphLabels } from '../../../core/models';
  import Label from '../../../common/label/Label.svelte';
  import { searchBy } from '../../../common/label/label.utils';
  import { widgetType } from '../../../core/stores/widget.store';
  import { createEventDispatcher } from 'svelte';
  import type { Classification } from '@nuclia/core';
  export let labels: ParagraphLabels = { labels: [], annotatedLabels: [] };
  $: allLabels = [...labels.labels, ...labels.annotatedLabels];

  const dispatch = createEventDispatcher();
  function removeLabel(label: Classification) {
    dispatch('labelsChange', label);
  }
</script>

<div class="sw-paragraph">
  <div class="icon">
    <slot name="icon" />
  </div>
  <div class="content">
    <slot name="content" />
    {#if allLabels.length > 0}
      <div class="labels">
        {#each allLabels as label (label.labelset + label.label)}
          <div class="label">
            <Label
              {label}
              removable
              clickable={$widgetType === 'search'}
              on:remove={() => removeLabel(label)}
              on:click={() => searchBy(label, true)} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style
  lang="scss"
  src="./Paragraph.scss"></style>
