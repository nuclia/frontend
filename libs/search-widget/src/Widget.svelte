<svelte:options tag="nuclia-search"/>

<script lang="ts">
  import PopupSearch from './widgets/PopupSearch.svelte';
  import EmbeddedSearch from './widgets/EmbeddedSearch.svelte';
  import { nucliaStore, nucliaState, setWidgetActions, resetStore, setDisplayedResource } from './core/store';
  import { getResource, initNuclia, resetNuclia, search, suggest } from './core/api';
  import { concatMap, debounceTime, filter, map, switchMap, take, tap } from 'rxjs/operators';
  import { onMount } from 'svelte';
  import { NO_RESULTS, PENDING_RESULTS } from './core/models';
  import { predict } from './core/tensor';
  import {
    setCDN,
    formatQueryKey,
    updateQueryParams,
    coerceBooleanProperty,
    getCssVariablesAsText,
  } from './core/utils';
  import { setLang } from './core/i18n';
  import Modal from './components/modal/Modal.svelte';
  import Viewer from './viewer/Viewer.svelte';
  import type { KBStates, Resource } from '@nuclia/core';
  import { forkJoin, merge, Observable } from 'rxjs';

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
      },
      state,
    );
    if (cdn) {
      setCDN(cdn);
    }
    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    // Load CSS variables (must be done after the CDN was set) and custom styles
    getCssVariablesAsText().pipe(
      switchMap((cssVariables) => nucliaState().customStyle.pipe(
        map(customStyles => `${cssVariables} ${customStyles}`)
      ))
    ).subscribe((css) => style = css);

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
    merge(
      nucliaStore().query.pipe(filter((query) => query.slice(-1) === ' ')),
      nucliaStore().query.pipe(debounceTime(500)),
    )
      .pipe(
        tap(() => {
          nucliaStore().suggestions.next(NO_RESULTS);
          nucliaStore().intents.next({});
        }),
        filter((query) => !!query && query.length > 2),
        tap(() => nucliaStore().suggestions.next(PENDING_RESULTS)),
        switchMap((query) =>
          forkJoin([
            suggest(query).pipe(tap((results) => nucliaStore().suggestions.next(results))),
            predict(query).pipe(
              tap((predictions) =>
                nucliaStore().intents.next({
                  labels: predictions,
                }),
              ),
            ),
          ]),
        ),
      )
      .subscribe();
    nucliaStore()
      .triggerSearch.pipe(
      tap(() => nucliaStore().searchResults.next(PENDING_RESULTS)),
      switchMap(() => nucliaState().query.pipe(take(1))),
      map((query) => query.trim()),
      filter((query) => !!query),
      switchMap((query) => nucliaStore().searchOptions.pipe(map((options) => ({query, options})))),
      switchMap(({query, options}) => search(query, options)),
    )
      .subscribe((results) => nucliaStore().searchResults.next(results));
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
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;700&display=swap');

  .nuclia-widget {
    color: var(--color-dark-stronger);
    font-family: var(--font-family-body);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-body);
    text-align: left;

    box-sizing: border-box;
  }
</style>
