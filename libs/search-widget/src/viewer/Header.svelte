<script lang="ts">
  import type { Resource } from '@nuclia/core';
  import { getFile } from '../core/api';
  import { getWidgetActions } from '../core/store';
  import { formatDate } from '../core/utils';
  import { _ } from '../core/i18n';
  import { onMount, onDestroy } from 'svelte';
  import MimeIcon from '../components/icons/mime.svelte';
  import ActionMenu from './ActionMenu.svelte';

  export let resource: Resource;
  let thumbnail: string | undefined;

  onMount(() => {
    if (resource.thumbnail) {
      getFile(resource.thumbnail).subscribe((url) => {
        thumbnail = url;
      });
    }
  });

  onDestroy(() => {
    if (thumbnail) URL.revokeObjectURL(thumbnail);
  });
</script>

<div class="header">
  <div class="icon">
    <MimeIcon type={resource.icon} />
  </div>
  <div class="title">
    <h1>
      {resource.title}
    </h1>
    <div>
      <span class="metadata">{formatDate(resource.modified)}</span>
      {#if getWidgetActions().length > 0}
        <span class="action-menu"><ActionMenu uid={resource.id} /></span>
      {/if}
    </div>
  </div>
  {#if thumbnail}
    <img class="thumbnail" src={thumbnail} alt={resource.title + ' thumbnail'} />
  {/if}
</div>

<style>
  .header {
    display: grid;
    grid-template-columns: 84px auto;
    height: 196px;
    background-color: #222;
    color: #fff;
  }
  .icon {
    padding: 2em 0;
    text-align: center;
  }
  .title {
    grid-row: span 2;
    padding: 2em 5px 5px 5px;
  }
  h1 {
    margin: 0 0 0.75em 0;
    font-size: calc(var(--font-size-base) * 1.5);
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .action-menu {
    margin-left: 0.5em;
  }
  .thumbnail {
    width: 100%;
    object-fit: cover;
    object-position: top center;
  }
  .metadata {
    font-size: 0.8em;
    font-style: italic;
  }
  .metadata .separator {
    font-style: normal;
    margin: 0 0.5em;
  }

  @media (min-width: 640px) {
    .header {
      display: grid;
      grid-template-columns: 84px auto 340px;
    }
    .thumbnail {
      width: 340px;
    }
    .title {
      grid-row: span 1;
      padding: 2em 0;
    }
  }
</style>
