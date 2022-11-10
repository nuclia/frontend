<script lang="ts">
  import { ParagraphLabels } from '../../../core/models';
  import Label from '../../../common/label/Label.svelte';
  import { searchBy } from '../../../common/label/label.utils';
  import { widgetType } from '../../../core/stores/widget.store';
  export let labels: ParagraphLabels = { labels: [], annotatedLabels: [] };
  $: allLabels = [...labels.labels, ...labels.annotatedLabels];
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
              clickable={$widgetType === 'search'}
              on:click={() => searchBy(label)} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style
  lang="scss"
  src="./Paragraph.scss"></style>
