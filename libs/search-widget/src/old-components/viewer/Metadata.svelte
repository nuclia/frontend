<script lang="ts">
  import type { CloudLink } from '@nuclia/core';
  import { saveEntities, saveEntitiesAnnotations } from '../../core/api';
  import { getCDN, formatDate } from '../../core/utils';
  import { viewerStore } from '../../core/old-stores/viewer.store';
  import { _ } from '../../core/i18n';
  import Entities from './Entities.svelte';
  import Button from '../../common/button/Button.svelte';
  import { onDestroy } from 'svelte';
  import { annotationMode, annotations, selectedFamily } from '../../core/stores/annotation.store';
  import {
    files,
    links,
    previewLinks,
    resource,
    summaries,
    resourceHasEntities,
    resourceLabels,
  } from '../../core/stores/resource.store';
  import { entityGroups } from '../../core/stores/entities.store';
  import Label from '../../common/label/Label.svelte';
  import { searchBy } from '../../common/label/label.utils';
  import { canAnnotateEntities, widgetType } from '../../core/stores/widget.store';
  import ConfirmDialog from '../../common/modal/ConfirmDialog.svelte';

  let entitiesBackup: string;
  let customEntitiesBackup;

  const isSafari = navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome');
  let showSafariModal = false;

  onDestroy(() => {
    closeAnnotationMode();
  });

  const previewLink = (file: CloudLink) => {
    viewerStore.showPreview.next(true);
    viewerStore.linkPreview.next({ file });
  };

  const setAnnotationMode = () => {
    if (isSafari) {
      showSafariModal = true;
    } else {
      annotationMode.set(true);
      // stringify entities as backup otherwise the backup will get same modifications as the stored ones
      entitiesBackup = JSON.stringify(entityGroups.value);
      customEntitiesBackup = JSON.stringify($annotations);
    }
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

<div
  class="sw-metadata"
  class:annotation-mode={$annotationMode}>
  <h2 class="title-and-button">
    {!$annotationMode ? $_('entities.title') : 'All entities'}
    {#if $canAnnotateEntities}
      {#if !$annotationMode}
        <Button
          aspect="solid"
          kind="inverted"
          on:click={setAnnotationMode}>
          {$_('entities.annotations')}
        </Button>
      {:else}
        <div class="annotation-mode-buttons">
          <Button
            aspect="solid"
            kind="inverted"
            on:click={cancelAnnotationMode}>
            {$_('generic.cancel')}
          </Button>
          <Button
            aspect="solid"
            kind="primary"
            on:click={saveAnnotations}>
            {$_('generic.save')}
          </Button>
        </div>
      {/if}
    {/if}
  </h2>
  <div class="entities">
    <Entities />
  </div>
  {#if !$annotationMode && $resourceHasEntities}
    <div class="entities">
      <h3>{$_('entities.annotated')}</h3>
      <Entities showAnnotated={true} />
    </div>
  {/if}

  {#if !$annotationMode}
    <div class="fade-in">
      {#if $previewLinks.length > 0}
        <div class="preview-links">
          {#each $previewLinks as file}
            <a
              class="download"
              href={file.uri}
              on:click|preventDefault={() => previewLink(file)}>
              <img
                src={`${getCDN()}icons/document.svg`}
                alt="icon" />
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

      {#if $resourceLabels.length > 0}
        <div class="metadata-value">
          <h3>{$_('resource.classification')}</h3>
          <div class="labels">
            {#each $resourceLabels as label}
              <Label
                {label}
                clickable={$widgetType === 'search'}
                on:click={() => searchBy(label)} />
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
        <a
          class="download"
          href={file}
          target="_blank">
          <img
            src={`${getCDN()}icons/source.svg`}
            alt="icon" />
          <div>{$_('resource.source')}</div>
        </a>
      {/each}

      {#each $links as link}
        <a
          class="download"
          href={link}
          rel="noopener noreferrer"
          target="_blank">
          <img
            src={`${getCDN()}icons/source.svg`}
            alt="icon" />
          <div>{$_('resource.source')}</div>
        </a>
      {/each}
    </div>
  {/if}

  <ConfirmDialog
    show={showSafariModal}
    buttons={[{ label: 'Ok', action: 'confirm' }]}
    closeable
    on:cancel={() => (showSafariModal = false)}
    on:confirm={() => (showSafariModal = false)}>
    Entity annotation feature doesn't work on Safari yet. Please use Firefox or Chrome to use this feature.
  </ConfirmDialog>
</div>

<style
  lang="scss"
  src="./Metadata.scss"></style>
