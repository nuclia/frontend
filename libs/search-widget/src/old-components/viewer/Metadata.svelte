<script lang="ts">
  import type { CloudLink } from '@nuclia/core';
  import { saveEntities, saveEntitiesAnnotations } from '../../core/api';
  import { getCDN, formatDate } from '../../core/utils';
  import { viewerStore } from '../../core/old-stores/viewer.store';
  import { _ } from '../../core/i18n';
  import Entities from './Entities.svelte';
  import Button from '../../common/button/Button.svelte';
  import { fade } from 'svelte/transition';
  import { Duration } from '../../common/transition.utils';
  import { onDestroy } from 'svelte';
  import {
    annotationMode,
    annotations,
    selectedFamily,
  } from '../../core/stores/annotation.store';
  import {
    files,
    links,
    previewLinks,
    resource,
    resourceHasEntities,
    summaries,
  } from '../../core/stores/resource.store';
  import { entityGroups } from '../../core/stores/entities.store';
  import Label from "../../common/label/Label.svelte";

  let entitiesBackup: string;
  let customEntitiesBackup;

  onDestroy(() => {
    closeAnnotationMode();
  });

  const previewLink = (file: CloudLink) => {
    viewerStore.showPreview.next(true);
    viewerStore.linkPreview.next({file});
  };

  const setAnnotationMode = () => {
    annotationMode.set(true);
    // stringify entities as backup otherwise the backup will get same modifications as the stored ones
    entitiesBackup = JSON.stringify(entityGroups.value);
    customEntitiesBackup = JSON.stringify($annotations);
  };

  const cancelAnnotationMode = () => {
    if (entitiesBackup) {
      entityGroups.set(JSON.parse(entitiesBackup));
    }
    if (customEntitiesBackup) {
      annotations.set(JSON.parse(customEntitiesBackup));
    }
    closeAnnotationMode();
  };

  const saveAnnotations = () => {
    const field = viewerStore.currentField.value;
    if (field) {
      if (entitiesBackup !== JSON.stringify(entityGroups.value)) {
        saveEntities(JSON.parse(entitiesBackup), entityGroups.value).subscribe();
      }
      saveEntitiesAnnotations(resource.value!, field, annotations.value).subscribe(() => closeAnnotationMode());
    }
  };

  const closeAnnotationMode = () => {
    annotationMode.set(false);
    selectedFamily.set('');
  };
</script>

<div class="sw-metadata" class:annotation-mode={$annotationMode}>
  {#if $resourceHasEntities}
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
      <Entities/>
    </div>
    {#if !$annotationMode}
      <div class="entities">
        <h3>{$_('entities.annotated')}</h3>
        <Entities showAnnotated={true}/>
      </div>
    {/if}
  {/if}

  {#if !$annotationMode}
    <div transition:fade={{ duration: Duration.SUPERFAST }}>
      {#if $previewLinks.length > 0}
        <div class="preview-links">
          {#each $previewLinks as file}
            <a class="download" href={file.uri} on:click|preventDefault={() => previewLink(file)}>
              <img src={`${getCDN()}icons/document.svg`} alt="icon"/>
              <div>{$_('resource.preview')}</div>
            </a>
          {/each}
        </div>
      {/if}

      <h2>{$_('resource.other')}</h2>

      {#if $summaries.length > 0}
        <div class="metadata-value">
          <h3>{$_('resource.summary')}</h3>
          {#each $summaries as summary}
            <div class="summary">{summary}</div>
          {/each}
        </div>
      {/if}

      {#if $resource.created}
        <div class="metadata-value">
          <h3>{$_('resource.creation')}</h3>
          <div>{formatDate($resource.created)}</div>
        </div>
      {/if}

      {#if ($resource.usermetadata?.classifications || []).length > 0}
        <div class="metadata-value">
          <h3>{$_('resource.classification')}</h3>
          <div class="labels">
            {#each $resource.usermetadata?.classifications || [] as label}
              <Label {label}/>
            {/each}
          </div>
        </div>
      {/if}

      {#if $resource.metadata?.language}
        <div class="metadata-value">
          <h3>{$_('resource.language')}</h3>
          <div>{$resource.metadata.language}</div>
        </div>
      {/if}

      {#each $files || [] as file}
        <a class="download" href={file}>
          <img src={`${getCDN()}icons/source.svg`} alt="icon"/>
          <div>{$_('resource.source')}</div>
        </a>
      {/each}

      {#each $links as link}
        <a class="download" href={link} rel="noopener noreferrer" target="_blank">
          <img src={`${getCDN()}icons/source.svg`} alt="icon"/>
          <div>{$_('resource.source')}</div>
        </a>
      {/each}
    </div>
  {/if}
</div>

<style lang="scss" src="./Metadata.scss"></style>
