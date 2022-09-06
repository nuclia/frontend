<script lang="ts">
  import type { Classification } from '@nuclia/core';
  import Label from '../../components/label/Label.svelte';
  export let labels: Classification[] = [];
</script>

<div class="sw-paragraph">
  <div class="icon">
    <slot name="icon" />
  </div>
  <div class="content">
    <slot name="content" />
    {#if labels.length > 0}
      <div class="labels">
        {#each labels as label (label.labelset + label.label)}
          <div class="label">
            <Label {label} />
          </div>
        {/each}
      </div>
    {/if}
  </div>
</div>
