<script lang="ts">
  import type { Classification }  from '@nuclia/core';
  export let labels: Classification[] = [];
</script>

<div class="paragraph">
  <div class="icon">
    <slot name="icon" />
  </div>
  <div class="content">
    <slot name="content" />
    {#if labels.length > 0}
      <div class="labels">
        {#each labels as label}
          <div class="label">{ label.label }</div>
        {/each}
      </div>
    {/if}
  </div>
</div>

<style>
  .paragraph {
    display: flex;
  }
  .icon {
    flex: 0 0 auto;
    width: 78px;
  }
  .content {
    flex: 1 1 0;
    overflow-wrap: break-word;
    min-width: 0; /* Required for "break-word" to work */
  }
  .labels {
    display: flex;
    flex-wrap: wrap;
    margin-top: 0.5em;
  }
  .label {
    display: inline-block;
    margin: 0 4px 4px 0;
    padding: 0 0.5em;
    font-size: 0.75em;
    line-height: 1.25;
    white-space: nowrap;
    color: #454ade;
    background-color: #e6e6f9;
    border-radius: 1px;
  }
</style>
