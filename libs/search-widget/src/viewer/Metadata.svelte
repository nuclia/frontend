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
    const _summaries = resource.summary
      ? [resource.summary].concat(resource.getExtractedSummaries())
      : resource.getExtractedSummaries();
    summaries = _summaries.filter((s) => !!s);
    entities = Object.entries(resource.getNamedEntities())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map((e) => [e[0], e[1].filter((value) => !!value).sort((a, b) => a.localeCompare(b))]);
    files = getFileUrls(resource.getFiles().reduce((acc, f) => (f.uri ? acc.concat(f.uri) : acc), []));
    linksPreviews = getLinksPreviews(resource);
    links = getLinks(resource);
  }

  const previewLink = (file: CloudLink) => {
    viewerStore.showPreview.next(true);
    viewerStore.linkPreview.next({ file });
  };
</script>

<div class="sw-metadata">
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

  {#if (resource.usermetadata?.classifications || []).length > 0}
    <div class="metadata-value">
      <h3>{$_('resource.classification')}</h3>
      <div class="labels">
        {#each resource.usermetadata?.classifications || [] as label}
          <div class="label">{label.label}</div>
        {/each}
      </div>
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
</div>
