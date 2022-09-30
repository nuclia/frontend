<script lang="ts">
  import { ParagraphLabels } from '../../../core/models';
  import Label from '../../../common/label/Label.svelte';
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
            <Label {label} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style lang="scss" src="./Paragraph.scss"></style>
