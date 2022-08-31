<svelte:options tag="nuclia-search"/>

<script lang="ts">
  import PopupSearch from './widgets/PopupSearch.svelte';
  import EmbeddedSearch from './widgets/EmbeddedSearch.svelte';
  import { nucliaState, setWidgetActions, resetStore, setDisplayedResource } from './core/store';
  import { getResource, initNuclia, resetNuclia } from './core/api';
  import { concatMap, filter, tap } from 'rxjs/operators';
  import { onMount } from 'svelte';
  import {
    setCDN,
    formatQueryKey,
    updateQueryParams,
    coerceBooleanProperty, loadCssAsText, loadFonts,
  } from './core/utils';
  import { setLang } from './core/i18n';
  import Modal from './components/modal/Modal.svelte';
  import Viewer from './viewer/Viewer.svelte';
  import type { KBStates, Resource } from '@nuclia/core';
  import { Observable } from 'rxjs';
  import { setupSuggestionsAndPredictions, setupTriggerSearch } from './core/search-bar';

  export let backend = 'https://nuclia.cloud/api';
  export let widgetid = '';
  export let zone = '';
  export let knowledgebox = '';
  export let type = 'input'; // input, form
  export let placeholder = '';
  export let lang = '';
  export let cdn;
  export let apikey;
  export let kbslug = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';
  export let permalink = false;

  $: permalinkEnabled = coerceBooleanProperty(permalink);

  export const displayResource = (uid: string) => {
    if (uid) {
      setDisplayedResource({uid});
    } else {
      closeModal();
    }
  };
  export const setActions = setWidgetActions;

  let style: string;
  let showModal = false;
  let resource: Observable<Resource>;
  let ready = false;
  const previewQueryKey = formatQueryKey('preview');

  onMount(() => {
    initNuclia(
      widgetid,
      {
        backend,
        zone,
        knowledgeBox: knowledgebox,
        client,
        apiKey: apikey,
        kbSlug: kbslug,
        account,
        permalink: permalinkEnabled,
        highlight: true
      },
      state,
    );
    if (cdn) {
      setCDN(cdn);
    }
    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    loadFonts();
    // Load CSS variables (must be done after the CDN was set) and custom styles
    loadCssAsText().subscribe((css) => style = css);

    checkUrlParams();

    resource = nucliaState().displayedResource.pipe(
      filter((resource) => !!resource?.uid),
      concatMap((resource) => getResource(resource.uid)),
      tap((resource) => {
        showModal = true;
        if (permalinkEnabled) {
          const urlParams = new URLSearchParams(window.location.search);
          if (urlParams.get(previewQueryKey) !== resource.uuid) {
            urlParams.set(previewQueryKey, resource.uuid);
            updateQueryParams(urlParams);
          }
        }
      }),
    );

    setupSuggestionsAndPredictions();
    setupTriggerSearch();

    ready = true;

    return () => {
      resetStore();
      resetNuclia();
    };
  });

  const closeModal = () => {
    showModal = false;
    setDisplayedResource({uid: ''});
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get(previewQueryKey)) {
      urlParams.delete(previewQueryKey);
      updateQueryParams(urlParams);
    }
  };

  const checkUrlParams = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const uuid = urlParams.get(previewQueryKey);
    if (uuid) {
      displayResource(uuid);
    }
  };
</script>

<div class="nuclia-widget" style={style} data-version="__NUCLIA_DEV_VERSION__">
  {#if ready}
    {#if type === 'input'}
      <PopupSearch placeholder="{placeholder}"/>
    {:else if type === 'form'}
      <EmbeddedSearch placeholder="{placeholder}"/>
    {:else}
      {type} widget is not implemented yet
    {/if}
    <Modal show={showModal}
           on:close={closeModal}
           closeButton={true}
           --modal-width="var(--resource-modal-width)"
           --modal-width-md="var(--resource-modal-width-md)"
           --modal-height="var(--resource-modal-height)"
           --modal-height-md="var(--resource-modal-height-md)"
    >
      {#if $resource}
        <Viewer resource={$resource}/>
      {/if}
    </Modal>
  {/if}
</div>

<style>
  :global(mark) {
    background-color: inherit;
    font-weight: var(--font-weight-semi-bold);
  }
</style>
