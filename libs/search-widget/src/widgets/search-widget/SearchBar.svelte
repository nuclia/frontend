<svelte:options customElement="nuclia-search-bar" />

<script lang="ts">
  import type { KBStates, WidgetFeatures } from '@nuclia/core';
  import { initNuclia, resetNuclia } from '../../core/api';
  import { createEventDispatcher, onMount } from 'svelte';
  import { injectCustomCss, loadFonts, loadSvgSprite, setCDN } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import SearchInput from '../../components/search-input/SearchInput.svelte';
  import { setupTriggerSearch } from '../../core/search-bar';
  import globalCss from '../../common/_global.scss?inline';
  import { widgetFeatures, widgetFilters, widgetPlaceholder } from '../../core/stores/widget.store';
  import {
    activatePermalinks,
    activateTypeAheadSuggestions,
    initAnswer,
    initEntitiesStore,
    initLabelStore,
    initUsageTracking,
    initViewer,
    resetStatesAndEffects,
    setupTriggerGraphNerSearch
  } from '../../core/stores/effects';
  import { preselectedFilters, searchQuery, triggerSearch } from '../../core/stores/search.store';
  import { typeAhead } from '../../core/stores/suggestions.store';
  import type { WidgetFilters } from '../../core';

  export let backend = 'https://nuclia.cloud/api';
  export let zone = 'europe-1';
  export let knowledgebox: string;
  export let placeholder = '';
  export let lang = '';
  export let cdn = '';
  export let apikey = '';
  export let kbslug = '';  // TODO: kbslug not needed anymore once regional system come into service
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';
  export let features = '';
  export let standalone = false;
  export let proxy = false;
  export let mode = '';
  export let filters = '';
  export let preselected_filters = '';
  export let cssPath = '';
  export let prompt = '';

  $: darkMode = mode === 'dark';
  $: {
    widgetPlaceholder.set(placeholder || 'input.placeholder');
  }

  let _features: WidgetFeatures = {};
  let _filters: WidgetFilters = {};

  export function search(query: string) {
    searchQuery.set(query);
    typeAhead.set(query || '');
    triggerSearch.next();
  }

  export function reloadSearch() {
    console.log(`Reload search`);
    triggerSearch.next();
  }

  export function logState() {
    console.log(`Current widget configuration:`, {
      _features, _filters, prompt, preselected_filters, mode, proxy, standalone, backend,
      zone,
      knowledgebox,
      placeholder,
      lang,
      cdn,
      apikey,
      kbslug,
      account
    });
  }

  const dispatch = createEventDispatcher();
  const dispatchCustomEvent = (name: string, detail: any) => {
    dispatch(name, detail);
  };

  let svgSprite: string;
  let ready = false;
  let container: HTMLElement;

  onMount(() => {
    if (cdn) {
      setCDN(cdn);
    }
    _features = (features ? features.split(',').filter((feature) => !!feature) : []).reduce(
      (acc, current) => ({ ...acc, [current as keyof WidgetFeatures]: true }),
      {},
    );
    _filters = (filters ? filters.split(',').filter((filter) => !!filter) : []).reduce(
      (acc, current) => ({ ...acc, [current]: true }),
      {},
    );
    if (Object.keys(_filters).length === 0) {
      _filters.labels = true;
      _filters.entities = true;
    }
    initNuclia(
      {
        backend,
        zone,
        knowledgeBox: knowledgebox,
        client,
        apiKey: apikey,
        kbSlug: kbslug,
        standalone,
        proxy,
        account,
        accountId: account,
      },
      state,
      {
        highlight: true,
        features: _features,
        prompt,
      },
    );

    // Setup widget in the store
    widgetFeatures.set(_features);
    widgetFilters.set(_filters);

    if (_features.filter) {
      if (_filters.labels) {
        initLabelStore();
      }
      if (_filters.entities) {
        initEntitiesStore();
      }
    }
    if (preselected_filters) {
      preselectedFilters.set(preselected_filters.split(','));
    }
    if (_features.answers) {
      initAnswer();
    }
    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

    if (_features.suggestions || _features.autocompleteFromNERs) {
      activateTypeAheadSuggestions();
    }

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    setupTriggerSearch(dispatchCustomEvent);
    initViewer();
    if (_features.permalink) {
      activatePermalinks();
    }
    if (_features.knowledgeGraph) {
      setupTriggerGraphNerSearch();
    }
    initUsageTracking();
    injectCustomCss(cssPath, container);

    ready = true;

    return () => {
      resetNuclia();
      resetStatesAndEffects();
    };
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

<div
  bind:this={container}
  class="nuclia-widget"
  class:dark-mode={darkMode}
  data-version="__NUCLIA_DEV_VERSION__">
  {#if ready && !!svgSprite}
    <SearchInput />
  {/if}
  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style
  lang="scss"
  src="../../common/common-style.scss"></style>
