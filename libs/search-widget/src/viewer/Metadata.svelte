<script lang="ts">
  import type { Resource, CloudLink } from '@nuclia/core';
  import { getFileUrls } from '../core/api';
  import { getCDN, formatDate } from '../core/utils';
  import { viewerStore, getLinks, getLinksPreviews } from './store';
  import { _ } from '../core/i18n';
  import Entities from './Entities.svelte';
  import type { Observable } from 'rxjs';
  import { of } from 'rxjs';

  export let resource: Resource;

  let summaries: string[] = [];
  let entities: [string, string[]][] = [];
  let files: Observable<string[]> = of([]);
  let links: string[] = [];
  let linksPreviews: CloudLink[] = [];

  $: {
    summaries = [resource.summary].concat(resource.getExtractedSummaries()).filter((s) => !!s);
    entities = Object.entries(resource.getNamedEntities()).sort((a, b) => a[0].localeCompare(b[0]));
    files = getFileUrls(resource.getFiles().reduce((acc, f) => (f.uri ? acc.concat(f.uri) : acc), []));
    linksPreviews = getLinksPreviews(resource);
    links = getLinks(resource);
  }

  const previewLink = (file: CloudLink) => {
    viewerStore.showPreview.next(true);
    viewerStore.linkPreview.next({ file });
  };
</script>

{#if entities.length > 0}
  <h2>{$_('entities.title')}</h2>
  <div class="entities">
    <Entities {entities} />
  </div>
{/if}

{#if linksPreviews.length > 0}
  <div class="preview-links">
    {#each linksPreviews as file}
      <a class="download" href={file.uri} on:click|preventDefault={() => previewLink(file)}>
        <img src={`${getCDN()}icons/document.svg`} alt="icon" />
        <div>{$_('resource.preview')}</div>
      </a>
    {/each}
  </div>
{/if}

<h2>{$_('resource.other')}</h2>

{#if resource.summary}
  <div class="metadata-value">
    <h3>{$_('resource.summary')}</h3>
    {#each summaries as summary}
      <div class="summary">{summary}</div>
    {/each}
  </div>
{/if}

{#if resource.created}
  <div class="metadata-value">
    <h3>{$_('resource.creation')}</h3>
    <div>{formatDate(resource.created)}</div>
  </div>
{/if}

{#if resource.metadata?.language}
  <div class="metadata-value">
    <h3>{$_('resource.language')}</h3>
    <div>{resource.metadata.language}</div>
  </div>
{/if}

{#each $files as file}
  <a class="download" href={file}>
    <img src={`${getCDN()}icons/source.svg`} alt="icon" />
    <div>{$_('resource.source')}</div>
  </a>
{/each}

{#each links as link}
  <a class="download" href={link} rel="noopener noreferrer" target="_blank">
    <img src={`${getCDN()}icons/source.svg`} alt="icon" />
    <div>{$_('resource.source')}</div>
  </a>
{/each}

<style>
  h2 {
    font-size: calc(var(--font-size-base) * 1.125);
    margin-bottom: 1.75em;
  }

  .entities {
    margin-bottom: 2.5em;
  }

  .preview-links {
    margin: 1em 0 2em 0;
  }

  .download {
    display: inline-flex;
    align-items: center;
    font-weight: var(--font-weight-bold);
    color: inherit;
    text-decoration: none;
  }
  .download img {
    margin-right: 0.5em;
  }
  .summary {
    display: -webkit-box;
    -webkit-line-clamp: 5;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .metadata-value {
    margin-bottom: 1.75em;
  }

  .metadata-value h3 {
    margin: 0 0 0.25em 0;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semi-bold);
    font-style: italic;
  }
</style>
