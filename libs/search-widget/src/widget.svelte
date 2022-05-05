<svelte:options tag="nuclia-search" />

<script lang="ts">
  import ButtonWidget from './widgets/ButtonWidget.svelte';
  import InputWidget from './widgets/InputWidget.svelte';
  import FormWidget from './widgets/FormWidget.svelte';
  import { nucliaStore, nucliaState, setWidgetActions, resetStore, setDisplayedResource } from './core/store';
  import { getResource, initNuclia, search, suggest } from './core/api';
  import { concatMap, filter, switchMap, take, tap } from 'rxjs/operators';
  import { onMount } from 'svelte';
  import { NO_RESULTS, PENDING_RESULTS } from './core/models';
  import { setCDN } from './core/utils';
  import { setLang } from './core/i18n';
  import Modal from './components/modal/Modal.svelte';
  import Viewer from './viewer/Viewer.svelte';
  import type { KBStates, Resource } from '@nuclia/core';
  import type { Observable } from 'rxjs';

  export let backend = 'https://nuclia.cloud/api';
  export let widgetid = '';
  export let zone = '';
  export let knowledgebox = '';
  export let type = 'button'; // button, input, form
  export let lang = '';
  export let cdn;
  export let apikey;
  export let kbslug = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';

  export const displayResource = (uid: string) => {
    if (uid) {
      setDisplayedResource({ uid });
    } else {
      closeModal();
    }
  };
  export const setActions = setWidgetActions;

  let style: Observable<string>;
  let showModal = false;
  let resource: Observable<Resource>;
  let ready = false;

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
      },
      state,
    );
    if (cdn) {
      setCDN(cdn);
    }
    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);
    style = nucliaState().customStyle;
    resource = nucliaState().displayedResource.pipe(
      filter((resource) => !!resource?.uid),
      concatMap((resource) => getResource(resource.uid)),
      tap(() => (showModal = true)),
    );
    nucliaState()
      .query.pipe(
        tap(() => nucliaStore().suggestions.next(NO_RESULTS)),
        filter((query) => !!query && query.length > 2),
        tap(() => nucliaStore().suggestions.next(PENDING_RESULTS)),
        switchMap((query) => suggest(query)),
      )
      .subscribe((results) => nucliaStore().suggestions.next(results));
    nucliaStore()
      .triggerSearch.pipe(
        tap(() => nucliaStore().searchResults.next(PENDING_RESULTS)),
        switchMap(() => nucliaState().query.pipe(take(1))),
        filter((query) => !!query),
        switchMap((query) => search(query)),
      )
      .subscribe((results) => nucliaStore().searchResults.next(results));
    ready = true;

    return () => {
      resetStore();
    };
  });

  const closeModal = () => {
    showModal = false;
    setDisplayedResource({ uid: '' });
  };
</script>

<div class="nuclia-widget" style={$style} data-version="__NUCLIA_DEV_VERSION__">
  {#if ready}
    {#if type === 'button'}
      <ButtonWidget />
    {:else if type === 'input'}
      <InputWidget />
    {:else if type === 'form'}
      <FormWidget />
    {:else}
      {type} widget is not implemented yet
    {/if}
    <Modal show={showModal} transparent={true} on:close={closeModal} closeButton={true}>
      {#if $resource}
        <Viewer resource={$resource} />
      {/if}
    </Modal>
  {/if}
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;700&display=swap');
  .nuclia-widget {
    --color-primary-regular: var(--custom-color-primary-regular, black);
    --color-primary-muted: var(--custom-color-primary-muted, #707070);
    --color-light-stronger: var(--custom-color-light-stronger, white);
    --color-dark-light: var(--custom-color-dark-stronger, #f7f7f8);
    --color-dark-stronger: var(--custom-color-dark-stronger, #8296a6);
    --color-neutral-strong: var(--custom-color-neutral-strong, #ff0066);
    --color-backdrop: var(--custom-color-backdrop, rgba(0, 0, 0, 0.5));

    --font-size-base: var(--custom-font-size-base, 16px);
    --font-weight-body: var(--custom-font-weight-body, 300);
    --font-weight-semi-bold: var(--custom-font-weight-semi-bold, 500);
    --font-weight-bold: var(--custom-font-weight-semi-bold, 700);
    --line-height-body: calc(var(--font-size-base) * 1.25);
    --color-text-accent: var(--color-primary-regular);
    --font-family-body: 'Source Sans Pro', sans-serif;
    --border-radius: var(--custom-border-radius, 2px);

    --z-index-modal: var(--custom-z-index-modal, 10010);
    --z-index-modal-backdrop: var(--custom-z-index-modal-backdrop, 10000);

    --shadow-modal: 2px 2px 20px rgba(0, 0, 0, 0.2);

    --color-scrollbar-track: var(--custom-color-scrollbar-track, #fff);
    --color-scrollbar-thumb: var(--custom-color-scrollbar-thumb, #000);

    --input-widget-padding: var(--custom-input-widget-padding, initial);
    --input-widget-border-width: var(--custom-input-widget-border-width, 1px);
    --input-widget-border-style: var(--custom-input-widget-border-style, dashed);
    --input-widget-border-style-stronger: var(--custom-input-widget-border-style-stronger, solid);
    --input-widget-border-color: var(--custom-input-widget-border-color, var(--color-dark-stronger));
    --input-widget-border-radius: var(--custom-input-widget-border-radius, 2px);
    --input-widget-placeholder-color: var(--custom-input-widget-placeholder-color, var(--color-dark-stronger));

    color: var(--color-text-accent);
    font-family: var(--font-family-body);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-body);
    text-align: left;

    box-sizing: border-box;
  }
</style>
