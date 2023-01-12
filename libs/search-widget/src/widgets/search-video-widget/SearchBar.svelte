<svelte:options tag="nuclia-search-bar" />

<script lang="ts">
  import type { KBStates } from '@nuclia/core';
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { setCDN, loadFonts, loadSvgSprite } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import SearchInput from '../../old-components/search-input/SearchInput.svelte';
  import { setupTriggerSearch, unsubscribeTriggerSearch } from '../../core/search-bar';
  import globalCss from '../../common/_global.scss?inline';
  import { get_current_component } from 'svelte/internal';
  import { WidgetFeatures } from '@nuclia/core';
  import { widgetFeatures, widgetMode, widgetPlaceholder } from '../../core/stores/widget.store';
  import {
    activatePermalinks,
    activateTypeAheadSuggestions,
    initLabelStore,
    unsubscribeAllEffects,
  } from '../../core/stores/effects';
  import { searchQuery, searchState, triggerSearch } from '../../core/stores/search.store';
  import { unsubscribeViewerEffects } from '../../old-components/viewer/store/viewer-effects';
  import { suggestionState } from '../../core/stores/suggestions.store';

  export let backend = 'https://nuclia.cloud/api';
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
  export let features = '';

  let _features: WidgetFeatures = {};

  export const search = (query: string) => {
    searchQuery.set(query);
    triggerSearch.next();
  };

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
    initNuclia(
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
      initLabelStore();
    }
    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

    if (_features.suggestions) {
      activateTypeAheadSuggestions();
    }

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    setupTriggerSearch(dispatchCustomEvent);
    if (_features.permalink) {
      activatePermalinks();
    }

    ready = true;

    return () => {
      searchState.reset();
      suggestionState.reset();
      resetNuclia();
      unsubscribeAllEffects();
      unsubscribeViewerEffects();
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
