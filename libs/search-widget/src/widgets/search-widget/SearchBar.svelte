<svelte:options tag="nuclia-search-bar" />

<script lang="ts">
  import type { KBStates, Resource, Search } from '@nuclia/core';
  import {
    CLAUSES,
    clauseSearch,
    facetByClause,
    findClauses,
    fullLoad,
    getLabelledClause,
    getMatchingClause,
    initNuclia,
    resetNuclia,
  } from '../../core/api';
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
  import Button from '../../common/button/Button.svelte';
  import Breadcrumbs from '../../components/breadcrumbs/Breadcrumbs.svelte';

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
  const ROOT = { id: 'root', label: 'All' };
  let breadcrumbs: { id: string; label: string }[] = [ROOT];

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
  let showCanonicalClause = false;
  let clause = '';
  let clauseId = '';

  const TERRORISM_CLAUSES = ['LMA5219', 'LMA5390', 'LMA9184', 'NMA2918', 'NMA2919', 'NMA2920', 'NMA464', 'NMA0464'];

  let FULLDATA: Resource[] = [];
  let data: { [key: string]: { id: string; label: string; value: number; results?: Search.FindResults } };

  onMount(() => {
    if (cdn) {
      setCDN(cdn);
    }
    fullLoad().subscribe((res: any) => {
      FULLDATA = res;
      displayResults('root');
    });
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

    return () => {
      searchState.reset();
      suggestionState.reset();
      resetNuclia();
      unsubscribeAllEffects();
      unsubscribeTriggerSearch();
    };
  });

  function displayResults(id: string) {
    if (data && data[id]) {
      triggerSearch.next();
      const results = data[id].results;
      if (results) {
        searchResults.set({ results, append: false });
      }
    }
    if (id === 'root') {
      const withClause = findClauses(FULLDATA, TERRORISM_CLAUSES);
      const withoutClause = findClauses(FULLDATA, TERRORISM_CLAUSES, true);
      data = {
        with: {
          id: 'with',
          label: `With terrorism clause`,
          results: withClause,
          value: withClause.total,
        },
        without: {
          id: 'without',
          label: `Without terrorism clause`,
          results: withoutClause,
          value: withoutClause.total,
        },
      };
      breadcrumbs = [ROOT];
    } else if (id === 'with') {
      data = TERRORISM_CLAUSES.reduce((acc, clauseID) => {
        const res = findClauses(FULLDATA, [clauseID]);
        const total = res.total;
        if (total > 0) {
          acc[clauseID] = {
            id: clauseID,
            label: clauseID,
            value: total,
            results: res,
          };
        }
        return acc;
      }, {} as { [key: string]: { id: string; label: string; value: number; results: Search.FindResults } });
      breadcrumbs = [ROOT, { id, label: 'With clause' }];
    } else if (id === 'without') {
      breadcrumbs = [ROOT, { id, label: 'Without clause' }];
    } else if (TERRORISM_CLAUSES.includes(id)) {
      clause = CLAUSES[id] || '';
      clauseId = id;
      searchClause();
      showCanonicalClause = true;
    }
  }

  function searchClause() {
    getMatchingClause(clause).subscribe((res) => {
      data = Object.entries(res).reduce((acc, [key, value]) => {
        acc[key] = {
          id: key,
          label: key,
          value: value.length,
        };
        return acc;
      }, {} as { [key: string]: { id: string; label: string; value: number } });
      breadcrumbs = [ROOT, { id: 'with', label: 'With clause' }, { id: clauseId, label: clauseId }];
    });
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
  <Breadcrumbs
    items={breadcrumbs}
    on:click={(e) => displayResults(e.detail)} />
  <div class="terrorism-clauses">
    Terrorism clauses: {#each TERRORISM_CLAUSES as clauseID}<span>{clauseID}</span> {/each}
  </div>
  {#if data}
    <div class="clause">
      <div class="chart">
        <PieChart
          {data}
          on:click={(e) => displayResults(e.detail.id)} />
      </div>
      {#if showCanonicalClause}
        <div class="text">
          <h3>NMA464 canonical text</h3>
          <textarea bind:value={clause} />
          <Button on:click={() => searchClause()}>Search clause</Button>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style
  lang="scss"
  src="../../common/common-style.scss"></style>
