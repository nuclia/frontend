<svelte:options tag="nuclia-search-bar"/>

<script lang="ts">
  import type { KBStates } from '@nuclia/core';
  import { nucliaStore, nucliaState, resetStore } from './core/store';
  import { initNuclia, resetNuclia, search, suggest } from './core/api';
  import { debounceTime, filter, map, switchMap, take, tap } from 'rxjs/operators';
  import { onMount } from 'svelte';
  import { NO_RESULTS, PENDING_RESULTS } from './core/models';
  import { predict } from './core/tensor';
  import { setCDN, coerceBooleanProperty, getCssVariablesAsText } from './core/utils';
  import { setLang } from './core/i18n';
  import { forkJoin, merge } from 'rxjs';
  import SearchInput from './widgets/search-input/SearchInput.svelte';

  export let backend = 'https://nuclia.cloud/api';
  export let widgetid = '';
  export let zone = '';
  export let knowledgebox = '';
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

  let cssVariables;
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
        permalink: permalinkEnabled,
      },
      state,
    );
    if (cdn) {
      setCDN(cdn);
    }

    // Load CSS variables (must be done after the CDN was set) and custom styles
    getCssVariablesAsText().pipe(
      switchMap((cssVariables) => nucliaState().customStyle.pipe(
        map(customStyles => `${cssVariables} ${customStyles}`)
      ))
    ).subscribe((css) => cssVariables = css);

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

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

</script>

<div class="nuclia-widget nuclia-search-bar"
     style="{cssVariables}"
     data-version="__NUCLIA_DEV_VERSION__">
  {#if ready}
    <SearchInput placeholder="{placeholder}" searchBarWidget="{true}"/>
  {/if}
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@300;400;700&display=swap');
</style>
