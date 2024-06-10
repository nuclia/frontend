<svelte:options
  customElement="nuclia-search-bar"
  accessors />

<script lang="ts">
  import type { KBStates, Nuclia, RAGImageStrategy, RAGStrategy, WidgetFeatures } from '@nuclia/core';
  import { downloadDump, initNuclia, resetNuclia } from '../../core/api';
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    getRAGImageStrategies,
    getRAGStrategies,
    injectCustomCss,
    loadFonts,
    loadSvgSprite,
    setCDN,
  } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import SearchInput from '../../components/search-input/SearchInput.svelte';
  import { setupTriggerSearch } from '../../core/search-bar';
  import globalCss from '../../common/_global.scss?inline';
  import {
    notEnoughDataMessage,
    widgetFeatures,
    widgetFilters,
    widgetImageRagStrategies,
    widgetPlaceholder,
    widgetRagStrategies,
  } from '../../core/stores/widget.store';
  import {
    activatePermalinks,
    activateTypeAheadSuggestions,
    initAnswer,
    initEntitiesStore,
    initLabelStore,
    initUsageTracking,
    initViewer,
    setupTriggerGraphNerSearch,
  } from '../../core/stores/effects';
  import { entityRelations, preselectedFilters, searchQuery, triggerSearch } from '../../core/stores/search.store';
  import { typeAhead } from '../../core/stores/suggestions.store';
  import type { WidgetFilters } from '../../core';
  import { InfoCard } from '../../components';
  import { IconButton, Modal } from '../../common';
  import { BehaviorSubject, delay, filter, firstValueFrom, map, take } from 'rxjs';

  export let backend = 'https://nuclia.cloud/api';
  export let zone = 'europe-1';
  export let knowledgebox: string;
  export let placeholder = '';
  export let lang = '';
  export let cdn = '';
  export let apikey = '';
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
  export let generativemodel = '';
  export let no_tracking = false;
  export let rag_strategies = '';
  export let rag_image_strategies = '';
  export let not_enough_data_message = '';
  export let ask_to_resource = '';
  export let max_tokens: number | undefined = undefined;

  let _ready = new BehaviorSubject(false);
  const ready = _ready.asObservable().pipe(filter((r) => r));
  export const onReady = () => firstValueFrom(ready);
  let nucliaAPI: Nuclia;
  export let initHook: (n: Nuclia) => void = () => {};

  $: darkMode = mode === 'dark';
  $: {
    widgetPlaceholder.set(placeholder || 'input.placeholder');
  }
  $: {
    notEnoughDataMessage.set(not_enough_data_message);
  }

  let _features: WidgetFeatures = {};
  let _filters: WidgetFilters = {};
  let _ragStrategies: RAGStrategy[] = [];
  let _ragImageStrategies: RAGImageStrategy[] = [];

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
      _features,
      _filters,
      _ragStrategies,
      prompt,
      generativemodel,
      preselected_filters,
      mode,
      proxy,
      standalone,
      backend,
      zone,
      knowledgebox,
      placeholder,
      lang,
      cdn,
      apikey,
      account,
      not_enough_data_message,
    });
  }

  export function dump() {
    downloadDump();
  }

  const dispatch = createEventDispatcher();
  const dispatchCustomEvent = (name: string, detail: any) => {
    dispatch(name, detail);
  };

  let svgSprite: string;
  let container: HTMLElement;

  let showRelations = false;

  ready.pipe(delay(200)).subscribe(() => {
    initHook(nucliaAPI);

    // any feature that calls the Nuclia API immediately at init time must be done here
    if (_features.permalink) {
      activatePermalinks();
    }
  });

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
    _ragStrategies = getRAGStrategies(rag_strategies);
    _ragImageStrategies = getRAGImageStrategies(rag_image_strategies);

    nucliaAPI = initNuclia(
      {
        backend,
        zone,
        knowledgeBox: knowledgebox,
        client,
        apiKey: apikey,
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
        generative_model: generativemodel,
        ask_to_resource,
        max_tokens,
      },
      no_tracking,
    );

    // Setup widget in the store
    widgetFeatures.set(_features);
    widgetFilters.set(_filters);
    widgetRagStrategies.set(_ragStrategies);
    widgetImageRagStrategies.set(_ragImageStrategies);

    if (_features.filter) {
      if (_filters.labels || _filters.labelFamilies) {
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

    if (_features.knowledgeGraph) {
      setupTriggerGraphNerSearch();
    }
    initUsageTracking(no_tracking);
    injectCustomCss(cssPath, container);

    _ready.next(true);

    return () => resetNuclia();
  });

  function displayRelations() {
    showRelations = true;
  }
  function hideRelations() {
    showRelations = false;
  }
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

<div
  bind:this={container}
  class="nuclia-widget"
  class:dark-mode={darkMode}
  data-version="__NUCLIA_DEV_VERSION__">
  {#if $ready && !!svgSprite}
    <div class="search-box">
      <SearchInput on:resetQuery={() => dispatchCustomEvent('resetQuery', '')}/>

      {#if $entityRelations.length > 0}
        <IconButton
          icon="info"
          aspect="basic"
          on:click={displayRelations} />
      {/if}
    </div>
  {/if}

  <Modal
    show={showRelations}
    on:close={hideRelations}>
    <div class="close-button">
      <IconButton
        icon="cross"
        aspect="basic"
        on:click={hideRelations} />
    </div>
    <div class="dialog-content">
      <InfoCard entityRelations={$entityRelations} />
    </div>
  </Modal>

  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style
  lang="scss"
  src="./SearchBar.scss"></style>
