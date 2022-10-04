<script lang="ts">
  import type { Resource, CloudLink } from '@nuclia/core';
  import { getFileUrls, saveEntities, saveEntitiesAnnotations } from '../../core/api';
  import { getCDN, formatDate } from '../../core/utils';
  import { viewerStore, getLinks, getLinksPreviews } from '../../core/old-stores/viewer.store';
  import { _ } from '../../core/i18n';
  import Entities from './Entities.svelte';
  import type { Observable } from 'rxjs';
  import Button from '../../common/button/Button.svelte';
  import { fade } from 'svelte/transition';
  import { Duration } from '../../common/transition.utils';
  import { nucliaStore } from '../../core/old-stores/main.store';
  import { onDestroy } from 'svelte';

  export let resource: Resource;

  let summaries: string[];
  let files: Observable<string[]>;
  let links: string[];
  let linksPreviews: CloudLink[];

  const annotationMode = viewerStore.annotationMode;
  const hasEntities = viewerStore.hasEntities;
  let entitiesBackup: string;
  let customEntitiesBackup;

  $: {
    const _summaries = resource.summary
      ? [resource.summary].concat(resource.getExtractedSummaries())
      : resource.getExtractedSummaries();
    summaries = _summaries.filter((s) => !!s);
    files = getFileUrls(resource.getFiles().reduce((acc, f) => (f.uri ? acc.concat(f.uri) : acc), []));
    linksPreviews = getLinksPreviews(resource);
    links = getLinks(resource);
  }

  onDestroy(() => {
    closeAnnotationMode();
  });

  const previewLink = (file: CloudLink) => {
    viewerStore.showPreview.next(true);
    viewerStore.linkPreview.next({ file });
  };

  const setAnnotationMode = () => {
    annotationMode.next(true);
    // stringify entities as backup otherwise the backup will get same modifications as the stored ones
    entitiesBackup = JSON.stringify(nucliaStore().entities.getValue());
    customEntitiesBackup = viewerStore.annotations.getValue();
  };

  const cancelAnnotationMode = () => {
    if (entitiesBackup) {
      nucliaStore().entities.next(JSON.parse(entitiesBackup));
    }
    if (customEntitiesBackup) {
      viewerStore.annotations.next(customEntitiesBackup);
    }
    closeAnnotationMode();
  };

  const saveAnnotations = () => {
    const field = viewerStore.currentField.getValue();
    if (field) {
      const entityGroups = nucliaStore().entities.getValue();
      if (entitiesBackup !== JSON.stringify(entityGroups)) {
        saveEntities(JSON.parse(entitiesBackup), entityGroups).subscribe();
      }
      saveEntitiesAnnotations(resource, field, viewerStore.annotations.getValue()).subscribe(() =>
        closeAnnotationMode(),
      );
    }
  };

  const closeAnnotationMode = () => {
    annotationMode.next(false);
    viewerStore.selectedFamily.next(null);
  };
</script>

<div class="sw-metadata" class:annotation-mode={$annotationMode}>
  {#if $hasEntities}
    <h2 class="title-and-button">
      {!$annotationMode ? $_('entities.title') : 'All entities'}

      {#if !$annotationMode}
        <Button aspect="solid" kind="inverted" on:click={setAnnotationMode}>
          {$_('entities.annotations')}
        </Button>
      {:else}
        <div class="annotation-mode-buttons">
          <Button aspect="solid" kind="inverted" on:click={cancelAnnotationMode}>
            {$_('generic.cancel')}
          </Button>
          <Button aspect="solid" kind="primary" on:click={saveAnnotations}>
            {$_('generic.save')}
          </Button>
        </div>
      {/if}
    </h2>
    <div class="entities">
      <Entities />
    </div>
    {#if !$annotationMode}
      <div class="entities">
        <h3>{$_('entities.annotated')}</h3>
        <Entities showAnnotated={true} />
      </div>
    {/if}
  {/if}

  {#if !$annotationMode}
    <div transition:fade={{ duration: Duration.SUPERFAST }}>
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

      {#each $files || [] as file}
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
  {/if}
</div>

<style lang="scss" src="./Metadata.scss"></style>
