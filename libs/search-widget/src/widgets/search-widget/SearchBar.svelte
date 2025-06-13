<svelte:options
  customElement={{
    tag: 'nuclia-search-bar',
    props: {
      kbstate: { attribute: 'state' },
    },
  }}
  accessors />

<script lang="ts">
  import { run } from 'svelte/legacy';

  import {
    parseRAGImageStrategies,
    parseRAGStrategies,
    Reranker,
    type KBStates,
    type Nuclia,
    type RAGImageStrategy,
    type RAGStrategy,
    type Widget,
  } from '@nuclia/core';
  import { BehaviorSubject, delay, filter, firstValueFrom, of } from 'rxjs';
  import { createEventDispatcher, onMount } from 'svelte';
  import { IconButton, Modal } from '../../common';
  import globalCss from '../../common/global.css?inline';
  import { InfoCard, onClosePreview } from '../../components';
  import SearchInput from '../../components/search-input/SearchInput.svelte';
  import { type WidgetFilters } from '../../core';
  import { downloadDump, getApiErrors, getSearchConfig, initNuclia, resetNuclia } from '../../core/api';
  import { setLang } from '../../core/i18n';
  import { setupTriggerSearch } from '../../core/search-bar';
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
  import {
    askBackendConfig,
    entityRelations,
    findBackendConfig,
    preselectedFilters,
    searchFilters,
    searchQuery,
    triggerSearch,
  } from '../../core/stores/search.store';
  import { typeAhead } from '../../core/stores/suggestions.store';
  import {
    chatPlaceholder,
    widgetFeatures,
    widgetFeedback,
    widgetFilters,
    widgetImageRagStrategies,
    widgetJsonSchema,
    widgetPlaceholder,
    widgetRagStrategies,
  } from '../../core/stores/widget.store';
  import { injectCustomCss, loadFonts, loadSvgSprite, loadWidgetConfig, setCDN } from '../../core/utils';

  const _ready = new BehaviorSubject(false);
  const ready = _ready.asObservable().pipe(filter((r) => r));
  export const onReady = () => firstValueFrom(ready);
  export const onError = getApiErrors();
  export const reset = () => resetNuclia();

  let nucliaAPI: Nuclia;
  class Props {
    backend = 'https://nuclia.cloud/api';
    zone = 'europe-1';
    knowledgebox: string;
    placeholder?: string;
    lang?: string;
    cdn?: string;
    apikey?: string;
    account?: string;
    client = 'widget';
    kbstate: KBStates = 'PUBLISHED';
    features?: string;
    standalone = false;
    proxy = false;
    mode?: string;
    filters?: string;
    preselected_filters?: string;
    csspath?: string;
    prompt?: string;
    system_prompt?: string;
    rephrase_prompt?: string;
    generativemodel?: string;
    no_tracking = false;
    rag_strategies?: string;
    rag_images_strategies?: string;
    not_enough_data_message?: string;
    ask_to_resource?: string;
    max_tokens?: number | string | undefined;
    max_output_tokens?: number | string | undefined;
    max_paragraphs?: number | string | undefined;
    query_prepend?: string;
    json_schema?: string;
    vectorset?: string;
    chat_placeholder?: string;
    audit_metadata?: string;
    reranker?: Reranker | undefined;
    citation_threshold?: number | string | undefined;
    rrf_boosting?: number | string | undefined;
    feedback: Widget.WidgetFeedback = 'answer';
    copy_disclaimer?: string | undefined;
    metadata?: string | undefined;
    widget_id?: string | undefined;
    search_config_id?: string | undefined;
    security_groups?: string | undefined;
    initHook: (n: Nuclia) => void = () => {};
  }

  let { ...componentProps } = $props();
  let config = $state(new Props());

  let backend = $derived(componentProps.backend || config.backend);
  let zone = $derived(componentProps.zone || config.zone);
  let knowledgebox = $derived(componentProps.knowledgebox || config.knowledgebox);
  let placeholder = $derived(componentProps.placeholder || config.placeholder);
  let lang = $derived(componentProps.lang || config.lang || window.navigator.language.split('-')[0] || 'en');
  let cdn = $derived(componentProps.cdn || config.cdn);
  let apikey = $derived(componentProps.apikey || config.apikey);
  let account = $derived(componentProps.account || config.account);
  let client = $derived(componentProps.client || config.client);
  let kbstate = $derived(componentProps.kbstate || config.kbstate);
  let features = $derived(componentProps.features || config.features);
  let standalone = $derived(componentProps.standalone || config.standalone);
  let proxy = $derived(componentProps.proxy || config.proxy);
  let mode = $derived(componentProps.mode || config.mode);
  let filters = $derived(componentProps.filters || config.filters);
  let preselected_filters = $derived(componentProps.preselected_filters || config.preselected_filters);
  let csspath = $derived(componentProps.csspath || config.csspath);
  let prompt = $derived(componentProps.prompt || config.prompt);
  let system_prompt = $derived(componentProps.system_prompt || config.system_prompt);
  let rephrase_prompt = $derived(componentProps.rephrase_prompt || config.rephrase_prompt);
  let generativemodel = $derived(componentProps.generativemodel || config.generativemodel);
  let no_tracking = $derived(componentProps.no_tracking || config.no_tracking);
  let rag_strategies = $derived(componentProps.rag_strategies || config.rag_strategies);
  let rag_images_strategies = $derived(componentProps.rag_images_strategies || config.rag_images_strategies);
  let not_enough_data_message = $derived(componentProps.not_enough_data_message || config.not_enough_data_message);
  let ask_to_resource = $derived(componentProps.ask_to_resource || config.ask_to_resource);
  let max_tokens = $derived(componentProps.max_tokens || config.max_tokens);
  let max_output_tokens = $derived(componentProps.max_output_tokens || config.max_output_tokens);
  let max_paragraphs = $derived(componentProps.max_paragraphs || config.max_paragraphs);
  let query_prepend = $derived(componentProps.query_prepend || config.query_prepend);
  let json_schema = $derived(componentProps.json_schema || config.json_schema);
  let vectorset = $derived(componentProps.vectorset || config.vectorset);
  let chat_placeholder = $derived(componentProps.chat_placeholder || config.chat_placeholder);
  let audit_metadata = $derived(componentProps.audit_metadata || config.audit_metadata);
  let reranker = $derived(componentProps.reranker || config.reranker);
  let citation_threshold = $derived(componentProps.citation_threshold || config.citation_threshold);
  let rrf_boosting = $derived(componentProps.rrf_boosting || config.rrf_boosting);
  let feedback = $derived(componentProps.feedback || config.feedback);
  let copy_disclaimer = $derived(componentProps.copy_disclaimer || config.copy_disclaimer);
  let metadata = $derived(componentProps.metadata || config.metadata);
  let widget_id = $derived(componentProps.widget_id || config.widget_id);
  let search_config_id = $derived(componentProps.search_config_id || config.search_config_id);
  let security_groups = $derived(componentProps.security_groups || config.security_groups);
  let initHook = $derived(componentProps.initHook || config.initHook);

  let darkMode = $derived(mode === 'dark');
  run(() => {
    chatPlaceholder.set(chat_placeholder || 'answer.placeholder');
  });
  run(() => {
    widgetPlaceholder.set(placeholder || 'input.placeholder');
  });

  let _filters: WidgetFilters = {};
  let _features: Widget.WidgetFeatures = {};
  let _securityGroups: string[] | undefined;
  let _jsonSchema: object | null = null;
  let _ragStrategies: RAGStrategy[] = [];
  let _ragImagesStrategies: RAGImageStrategy[] = [];
  let _max_tokens: number | undefined;
  let _max_output_tokens: number | undefined;
  let _citation_threshold: number | undefined;
  let _rrf_boosting: number | undefined;
  let _max_paragraphs: number | undefined;

  export function search(query: string, filters?: string[], doNotTriggerSearch = false) {
    searchQuery.set(query);
    if (filters) {
      searchFilters.set({ filters });
    }
    typeAhead.set(query || '');
    if (!doNotTriggerSearch) {
      triggerSearch.next();
    }
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
      system_prompt,
      rephrase_prompt,
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
      vectorset,
      reranker,
      citation_threshold,
      rrf_boosting,
      feedback,
      widget_id,
      search_config_id,
    });
  }

  export function dump() {
    downloadDump();
  }

  export function closePreview() {
    onClosePreview();
  }

  const dispatch = createEventDispatcher();
  const dispatchCustomEvent = (name: string, detail: any) => {
    dispatch(name, detail);
  };

  let svgSprite: string = $state();
  let container: HTMLElement = $state();

  let showRelations = $state(false);

  ready.pipe(delay(200)).subscribe(() => {
    initHook(nucliaAPI);

    // any feature that calls the Nuclia API immediately at init time must be done here
    if (_features.permalink) {
      activatePermalinks();
    }
    if (_features.debug) {
      nucliaAPI.events.dump().subscribe((data) => {
        dispatchCustomEvent('logs', data);
      });
    }
  });
  // const component = get_current_component();

  onMount(() => {
    const nucliaOptions = {
      backend,
      zone,
      knowledgeBox: knowledgebox,
      client,
      apiKey: apikey,
      standalone,
      proxy,
      account,
      accountId: account,
    };
    (widget_id ? loadWidgetConfig(widget_id, nucliaOptions) : of({})).subscribe((loadedProperties) => {
      config = { ...config, ...loadedProperties };

      if (cdn) {
        setCDN(cdn);
      }
      _features = (features ? features.split(',').filter((feature) => !!feature) : []).reduce(
        (acc, current) => ({ ...acc, [current as keyof Widget.WidgetFeatures]: true }),
        {},
      );
      _filters = (filters ? filters.split(',').filter((filter) => !!filter) : []).reduce(
        (acc, current) => ({ ...acc, [current]: true }),
        {},
      );
      if (Object.keys(_filters).length === 0) {
        _filters.labels = true;
      }
      _securityGroups = security_groups?.split(',').filter((group) => !!group);
      _ragStrategies = parseRAGStrategies(rag_strategies);
      _ragImagesStrategies = parseRAGImageStrategies(rag_images_strategies);
      try {
        _jsonSchema = json_schema ? JSON.parse(json_schema) : null;
      } catch (e) {
        _jsonSchema = null;
      }
      _max_tokens = typeof max_tokens === 'string' ? parseInt(max_tokens, 10) : max_tokens;
      _max_output_tokens = typeof max_output_tokens === 'string' ? parseInt(max_output_tokens, 10) : max_output_tokens;
      _citation_threshold =
        typeof citation_threshold === 'string' ? parseFloat(citation_threshold) : citation_threshold;
      _rrf_boosting = typeof rrf_boosting === 'string' ? parseFloat(rrf_boosting) : rrf_boosting;
      _max_paragraphs = typeof max_paragraphs === 'string' ? parseInt(max_paragraphs, 10) : max_paragraphs;

      nucliaAPI = initNuclia(
        nucliaOptions,
        kbstate,
        {
          features: _features,
          prompt,
          system_prompt,
          rephrase_prompt,
          generative_model: generativemodel,
          ask_to_resource,
          max_tokens: _max_tokens,
          max_output_tokens: _max_output_tokens,
          max_paragraphs: _max_paragraphs,
          query_prepend,
          vectorset,
          audit_metadata,
          reranker,
          citation_threshold: _citation_threshold,
          rrf_boosting: _rrf_boosting,
          feedback,
          copy_disclaimer,
          not_enough_data_message,
          metadata,
          security_groups: _securityGroups,
        },
        no_tracking,
      );

      // Setup widget in the store
      widgetFeatures.set(_features);
      widgetFilters.set(_filters);
      widgetRagStrategies.set(_ragStrategies);
      widgetImageRagStrategies.set(_ragImagesStrategies);
      widgetJsonSchema.set(_jsonSchema);
      widgetFeedback.set(feedback);

      if (_features.filter) {
        if (_filters.labels || _filters.labelFamilies) {
          initLabelStore();
        }
        if (_filters.entities) {
          initEntitiesStore();
        }
      }
      if (preselected_filters) {
        preselectedFilters.set(preselected_filters);
      }
      if (_features.answers) {
        initAnswer();
      }
      loadFonts();
      loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));

      if (_features.suggestions || _features.autocompleteFromNERs) {
        activateTypeAheadSuggestions();
      }

      setLang(lang);

      setupTriggerSearch(dispatchCustomEvent);
      initViewer(dispatchCustomEvent);

      if (_features.knowledgeGraph) {
        setupTriggerGraphNerSearch();
      }
      initUsageTracking(no_tracking);
      injectCustomCss(csspath, container);

      if (search_config_id) {
        getSearchConfig(search_config_id).subscribe((config) => {
          if (config) {
            if (config.kind === 'find') {
              findBackendConfig.set(config.config);
            } else if (config.kind === 'ask') {
              askBackendConfig.set(config.config);
            }
            _ready.next(true);
          }
        });
      } else {
        _ready.next(true);
      }
    });
    return () => resetNuclia();
  });

  function displayRelations() {
    showRelations = true;
  }
  function hideRelations() {
    showRelations = false;
  }
</script>

<svelte:element this={'style'}>{@html globalCss}</svelte:element>

<div
  bind:this={container}
  class="nuclia-widget"
  class:dark-mode={darkMode}
  data-version="__NUCLIA_DEV_VERSION__">
  {#if $ready && !!svgSprite}
    <div class="search-box">
      <SearchInput on:resetQuery={() => dispatchCustomEvent('resetQuery', '')} />

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

<style src="./SearchBar.css"></style>
