<script lang="ts">
  import type { Resource } from '@nuclia/core';
  import { getWidgetActions } from '../core/store';
  import { formatDate, getCDN } from '../core/utils';
  import { _ } from '../core/i18n';
  import MimeIcon from '../components/icons/mime.svelte';
  import ActionMenu from './ActionMenu.svelte';

  export let resource: Resource;
  let showMetadata = false;
</script>

<div class="header">
  <div class="icon">
    {#if resource.icon}
      <MimeIcon type={resource.icon} small />
    {/if}
  </div>
  <div class="header-center">
    <div class="title">
      <h1>{resource.title}</h1>
      {#if showMetadata}
        <div class="metadata">{formatDate(resource.modified)}</div>
      {/if}
    </div>
  </div>
  {#if getWidgetActions().length > 0}
    <div class="actions">
      <button on:click={() => showMetadata = !showMetadata}>
        {#if showMetadata}
          <img src={`${getCDN()}icons/close.svg`} alt="close" />
        {:else}
          <img src={`${getCDN()}icons/info.svg`} alt="icon" />
        {/if}
      </button>
      <ActionMenu uid={resource.id} />
    </div>
  {/if}
</div>

<style>
  .header {
    display: grid;
    grid-template-columns: 38px auto 80px;
    align-items: center;
    min-height: 76px;
    padding-left: 1em;
    background-color: var(--color-light-stronger);
    border-bottom: 1px solid var(--color-neutral-regular);
  }
  .icon {
    width: 22px;
  }
  .header-center {
    display: flex;
    min-width: 0;
  }
  .title {
    min-width: 0;
    overflow-wrap: break-word;
  }
  h1 {
    margin: 0;
    font-size: calc(var(--font-size-base) * 1.25);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .metadata {
    position: absolute;
    font-size: 0.8em;
    font-style: italic;
  }
  .actions {
    display: flex;
  }
  button {
    border: none;
    border-radius: 50%;
    height: 32px;
    width: 32px;
    padding: 0;
    cursor: pointer;
    background: none;
    text-align: center;
    margin-right: 0.5em;
  }
  button:hover {
    background-color: var(--color-neutral-lightes);
  }
  @media (min-width: 640px) {
    .header {
      grid-template-columns: 38px auto 110px;
      padding-left: 2em;
    }
  }
</style>
