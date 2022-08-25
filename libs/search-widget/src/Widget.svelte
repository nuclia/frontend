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
  import { setCDN, formatQueryKey, updateQueryParams, coerceBooleanProperty } from './core/utils';
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

  let style: Observable<string>;
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
    style = nucliaState().customStyle;

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

<div class="nuclia-widget" style={$style} data-version="__NUCLIA_DEV_VERSION__">
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
    --color-dark-stronger: var(--custom-color-dark-stronger, hsl(0, 0%, 5%));
    --color-light-stronger: var(--custom-color-light-stronger, #fff);

    --color-neutral-strong: var(--custom-color-neutral-strong, hsl(0, 0%, 44%));
    --color-neutral-regular: var(--custom-color-neutral-regular, hsl(0, 0%, 77%));
    --color-neutral-light: var(--custom-color-neutral-light, hsl(0, 0%, 90%));
    --color-neutral-lighter: var(--custom-color-neutral-lighter, hsl(0, 0%, 94%));
    --color-neutral-lightest: var(--custom-color-neutral-lightest, hsl(240, 7%, 97%));

    --color-primary-stronger: var(--custom-color-primary-stronger, hsl(336, 100%, 24%));
    --color-primary-strong: var(--custom-color-primary-strong, hsl(336, 100%, 36%));
    --color-primary-regular: var(--custom-color-primary-regular, hsl(336, 100%, 50%));
    --color-primary-light: var(--custom-color-primary-light, hsl(336, 100%, 73%));
    --color-primary-lighter: var(--custom-color-primary-lighter, hsl(336, 100%, 90%));
    --color-primary-lightest: var(--custom-color-primary-lightest, hsl(336, 100%, 96%));

    --color-secondary-stronger: var(--custom-color-secondary-stronger, hsl(51, 78%, 32%));
    --color-secondary-strong: var(--custom-color-secondary-strong, hsl(51, 100%, 41%));
    --color-secondary-regular: var(--custom-color-secondary-regular, hsl(51, 100%, 55%));
    --color-secondary-light: var(--custom-color-secondary-light, hsl(51, 100%, 75%));
    --color-secondary-lighter: var(--custom-color-secondary-lighter, hsl(51, 100%, 86%));
    --color-secondary-lightest: var(--custom-color-secondary-lightest, hsl(51, 100%, 95%));

    --color-tertiary-stronger: var(--custom-color-tertiary-stronger, hsl(249, 100%, 24%));
    --color-tertiary-strong: var(--custom-color-tertiary-strong, hsl(249, 100%, 40%));
    --color-tertiary-regular: var(--custom-color-tertiary-regular, hsl(249, 100%, 50%));
    --color-tertiary-light: var(--custom-color-tertiary-light, hsl(249, 100%, 65%));
    --color-tertiary-lighter: var(--custom-color-tertiary-lighter, hsl(249, 100%, 92%));
    --color-tertiary-lightest: var(--custom-color-tertiary-lightest, hsl(249, 100%, 96%));

    --spacer: 0.5em; /* 1unit - 8px - 0.5em */

    --rhythm-0_25: calc(var(--spacer) * .25);  /*   .25 unit -   2px -   .125 em  */
    --rhythm-0_5: calc(var(--spacer) * .5);    /*   .5  unit -   4px -   .25  em  */
    --rhythm-1: var(--spacer);                 /*  1    unit -   8px -   .5   em  */
    --rhythm-1_5: calc(var(--spacer) * 1.5);   /*  1.5  unit -  12px -   .75  em  */
    --rhythm-2: calc(var(--spacer) * 2);       /*  2    unit -  16px -  1     em  */
    --rhythm-3: calc(var(--spacer) * 3);       /*  3    unit -  24px -  1.5   em  */
    --rhythm-4: calc(var(--spacer) * 4);       /*  4    unit -  32px -  2     em  */
    --rhythm-5: calc(var(--spacer) * 5);       /*  5    unit -  40px -  2.5   em  */
    --rhythm-6: calc(var(--spacer) * 6);       /*  6    unit -  48px -  3     em  */
    --rhythm-7: calc(var(--spacer) * 7);       /*  7    unit -  56px -  3.5   em  */
    --rhythm-8: calc(var(--spacer) * 8);       /*  8    unit -  64px -  4     em  */
    --rhythm-9: calc(var(--spacer) * 9);       /*  9    unit -  72px -  4.5   em  */
    --rhythm-10: calc(var(--spacer) * 10);     /*  10   unit -  80px -  5     em  */
    --rhythm-12: calc(var(--spacer) * 12);     /*  12   unit -  96px -  6     em  */
    --rhythm-14: calc(var(--spacer) * 14);     /*  14   unit - 112px -  7     em  */
    --rhythm-16: calc(var(--spacer) * 16);     /*  16   unit - 128px -  8     em  */
    --rhythm-20: calc(var(--spacer) * 20);     /*  20   unit - 160px - 10     em  */
    --rhythm-22: calc(var(--spacer) * 22);     /*  22   unit - 176px - 11     em  */
    --rhythm-24: calc(var(--spacer) * 24);     /*  24   unit - 192px - 12     em  */
    --rhythm-28: calc(var(--spacer) * 28);     /*  28   unit - 224px - 14     em  */
    --rhythm-32: calc(var(--spacer) * 32);     /*  32   unit - 256px - 16     em  */
    --rhythm-40: calc(var(--spacer) * 40);     /*  40   unit - 320px - 20     em  */
    --rhythm-48: calc(var(--spacer) * 48);     /*  48   unit - 384px - 24     em  */
    --rhythm-56: calc(var(--spacer) * 56);     /*  56   unit - 448px - 28     em  */
    --rhythm-64: calc(var(--spacer) * 64);     /*  64   unit - 512px - 32     em  */

    --font-size-base: var(--custom-font-size-base, 16px);
    --font-weight-body: var(--custom-font-weight-body, 300);
    --font-weight-semi-bold: var(--custom-font-weight-semi-bold, 500);
    --font-weight-bold: var(--custom-font-weight-semi-bold, 700);
    --line-height-body: calc(var(--font-size-base) * 1.25);
    --font-family-body: 'Source Sans Pro', sans-serif;
    --border-radius: var(--custom-border-radius, var(--rhythm-0_25));

    --color-backdrop: var(--custom-color-backdrop, rgba(13, 13, 13, 0.5));
    --z-index-modal: var(--custom-z-index-modal, 10010);
    --z-index-modal-backdrop: var(--custom-z-index-modal-backdrop, 10000);

    /* We can't use var(--color-dark-stronger) in rgba because rgba needs the RGB triplet as input while --color-dark-stronger is the actual HSL color. */
    --shadow-modal: var(--custom-shadow-modal, var(--rhythm-0_25) var(--rhythm-0_25) var(--rhythm-2) rgba(13, 13, 13, 0.2));

    --color-scrollbar-track: var(--custom-color-scrollbar-track, var(--color-light-stronger));
    --color-scrollbar-thumb: var(--custom-color-scrollbar-thumb, var(--color-dark-stronger));

    --focus-shadow: var(--custom-focus-shadow, 0 0 0 var(--rhythm-0_25) var(--color-primary-lighter));

    --size-powered-by: calc(var(--rhythm-16) + var(--rhythm-1_5));
    --default-search-field-padding: var(--rhythm-1) var(--size-powered-by) var(--rhythm-1) var(--rhythm-5);
    --search-input-padding: var(--rhythm-0_5) var(--rhythm-5) var(--rhythm-0_5) var(--rhythm-0_5);

    --form-widget-padding: var(--custom-form-widget-padding, var(--default-search-field-padding));
    --form-widget-border-width: var(--custom-form-widget-border-width, 1px);
    --form-widget-border-style: var(--custom-form-widget-border-style, solid);
    --form-widget-border-style-stronger: var(--custom-form-widget-border-style-stronger, solid);
    --form-widget-border-color: var(--custom-form-widget-border-color, var(--color-neutral-strong));
    --form-widget-border-radius: var(--custom-form-widget-border-radius, 0);
    --form-widget-placeholder-color: var(--custom-form-widget-placeholder-color, --color-neutral-strong);

    --input-widget-padding: var(--custom-input-widget-padding, var(--search-input-padding));
    --input-widget-border-width: var(--custom-input-widget-border-width, 0 0 1px 0);
    --input-widget-border-style: var(--custom-input-widget-border-style, solid);
    --input-widget-border-style-stronger: var(--custom-input-widget-border-style-stronger, solid);
    --input-widget-border-color: var(--custom-input-widget-border-color, var(--color-dark-stronger));
    --input-widget-border-radius: var(--custom-input-widget-border-radius, 0);
    --input-widget-placeholder-color: var(--custom-input-widget-placeholder-color, transparent);

    --default-modal-width: calc(100vw - var(--rhythm-1_5));

    --resource-modal-width: var(--custom-resource-modal-width, var(--default-modal-width));
    --resource-modal-width-md: var(--custom-resource-modal-width-md, 80vw);
    --resource-modal-height: var(--custom-resource-modal-height, calc(100vh - var(--rhythm-16)));
    --resource-modal-height-md: var(--custom-resource-modal-height-md, 85vh);

    --search-bar-border: var(--custom-search-bar-border, 1px solid var(--color-neutral-strong));
    --search-bar-border-focus: var(--custom-search-bar-border-focus, 1px solid var(--color-primary-regular));
    --search-bar-border-radius: var(--custom-search-bar-border-radius, 0);
    --search-bar-padding: var(--custom-search-bar-padding, var(--default-search-field-padding));
    --search-bar-max-width: var(--custom-search-bar-max-width, var(--rhythm-56));

    color: var(--color-dark-stronger);
    font-family: var(--font-family-body);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-body);
    line-height: var(--line-height-body);
    text-align: left;

    box-sizing: border-box;
  }
</style>
