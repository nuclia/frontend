<svelte:options tag="nuclia-search-bar" />

<script lang="ts">
  import type { KBStates, Search } from '@nuclia/core';
  import { clauseSearch, facetByClause, initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { setCDN, loadFonts, loadSvgSprite } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import SearchInput from '../../components/search-input/SearchInput.svelte';
  import { setupTriggerSearch, unsubscribeTriggerSearch } from '../../core/search-bar';
  import globalCss from '../../common/_global.scss?inline';
  import { get_current_component } from 'svelte/internal';
  import type { WidgetFeatures } from '@nuclia/core';
  import { widgetFeatures, widgetMode, widgetPlaceholder } from '../../core/stores/widget.store';
  import {
    activatePermalinks,
    activateTypeAheadSuggestions,
    initAnswer,
    initLabelStore,
    loadFieldData,
    unsubscribeAllEffects,
  } from '../../core/stores/effects';
  import { searchQuery, searchResults, searchState, triggerSearch } from '../../core/stores/search.store';
  import { suggestionState, typeAhead } from '../../core/stores/suggestions.store';
  import PieChart from '../../components/charts/PieChart.svelte';
  import { forkJoin, take } from 'rxjs';

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
  export let standalone = false;

  let _features: WidgetFeatures = {};

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

  const TOPIC = 'terrorism';
  let data: { [key: string]: { id: string; label: string; value: number; results?: Search.FindResults } };

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
      initLabelStore();
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

    setupTriggerSearch(dispatchCustomEvent);
    loadFieldData();
    if (_features.permalink) {
      activatePermalinks();
    }

    ready = true;

    forkJoin([clauseSearch(TOPIC), clauseSearch(`policy -${TOPIC}`, { isAdvanced: true })])
      .pipe(take(1))
      .subscribe(([withClause, withoutClause]) => {
        data = {
          with: {
            id: 'with',
            label: `With ${TOPIC} clause`,
            results: withClause,
            value: withClause.total,
          },
          without: {
            id: 'without',
            label: `Without ${TOPIC} clause`,
            results: withoutClause,
            value: withoutClause.total,
          },
        };
      });

    return () => {
      searchState.reset();
      suggestionState.reset();
      resetNuclia();
      unsubscribeAllEffects();
      unsubscribeTriggerSearch();
    };
  });

  function displayResults(id: string) {
    if (data[id]) {
      triggerSearch.next();
      const results = data[id].results;
      if (results) {
        searchResults.set({ results, append: false });
      }
      if (id === 'with') {
        facetByClause().subscribe((facets) => {
          data = Object.entries(facets['/l/fake']).reduce((acc, [key, value]) => {
            acc[key] = {
              id: key,
              label: key.split('/').pop() || 'N/A',
              value,
            };
            return acc;
          }, {} as { [key: string]: { id: string; label: string; value: number } });
          console.log(data);
        });
      }
    }
  }
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
  {#if data}
    <PieChart
      {data}
      on:click={(e) => displayResults(e.detail.id)} />
  {/if}
</div>

<style
  lang="scss"
  src="../../common/common-style.scss"></style>
