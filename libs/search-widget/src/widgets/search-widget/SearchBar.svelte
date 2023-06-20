<svelte:options tag="nuclia-search-bar" />

<script lang="ts">
  import type { KBStates, WidgetFeatures } from '@nuclia/core';
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { loadFonts, loadSvgSprite, setCDN } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import SearchInput from '../../components/search-input/SearchInput.svelte';
  import { setupTriggerSearch, unsubscribeTriggerSearch } from '../../core/search-bar';
  import globalCss from '../../common/_global.scss?inline';
  import { get_current_component } from 'svelte/internal';
  import { widgetFeatures, widgetMode, widgetPlaceholder } from '../../core/stores/widget.store';
  import {
    activatePermalinks,
    activateTypeAheadSuggestions,
    initAnswer,
    initEntitiesStore,
    initLabelStore,
    initViewer,
    setupTriggerGraphNerSearch,
    unsubscribeAllEffects,
  } from '../../core/stores/effects';
  import { searchQuery, searchState, triggerSearch } from '../../core/stores/search.store';
  import { suggestionState, typeAhead } from '../../core/stores/suggestions.store';

  export let backend = 'https://nuclia.cloud/api';
  export let zone = 'europe-1';
  export let knowledgebox;
  export let placeholder = '';
  export let lang = '';
  export let cdn = '';
  export let apikey = '';
  export let kbslug = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';
  export let features = '';
  export let standalone = false;
  export let filters = '';

  let _features: WidgetFeatures = {};
  let _filters: { [key: 'labels' | 'entities']: boolean } = {};

  export function search(query: string) {
    searchQuery.set(query);
    typeAhead.set(query || '');
    triggerSearch.next();
  }

  export function reloadSearch() {
    console.log(`reloadSearch`);
    triggerSearch.next();
  }

  const thisComponent = get_current_component();
  const dispatchCustomEvent = (name: string, detail: any) => {
    thisComponent.dispatchEvent &&
      thisComponent.dispatchEvent(
        new CustomEvent(name, {
          detail,
          composed: true,
        }),
      );
  };

  let svgSprite;
  let ready = false;

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
      //_filters.entities = true;  // TODO: Uncomment once entity filters work properly
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
        account,
      },
      state,
      {
        highlight: true,
        features: _features,
      },
    );

    // Setup widget in the store
    widgetMode.set('embedded');
    widgetFeatures.set(_features);
    if (placeholder) {
      widgetPlaceholder.set(placeholder);
    }
    if (_features.filter) {
      if (_filters.labels) {
        initLabelStore();
      }
      if (_filters.entities) {
        initEntitiesStore();
      }
    }
    if (_features.answers) {
      initAnswer();
    }
    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

    if (_features.suggestions) {
      activateTypeAheadSuggestions();
    }

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    setupTriggerSearch(dispatchCustomEvent, _features.answers);
    initViewer();
    if (_features.permalink) {
      activatePermalinks();
    }
    if (_features.knowledgeGraph) {
      setupTriggerGraphNerSearch();
    }

    ready = true;

    return () => {
      searchState.reset();
      suggestionState.reset();
      resetNuclia();
      unsubscribeAllEffects();
      unsubscribeTriggerSearch();
    };
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>
<div
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if ready && !!svgSprite}
    <SearchInput searchBarWidget={true} />
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
