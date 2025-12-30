<svelte:options
  customElement={{
    tag: 'nuclia-floating-chat',
    props: {
      kbstate: { attribute: 'state' },
    },
  }}
  accessors />

<script lang="ts">
  import {
    parseRAGImageStrategies,
    parseRAGStrategies,
    Reranker,
    type FilterExpression,
    type KBStates,
    type Nuclia,
    type RAGImageStrategy,
    type RAGStrategy,
    type ReasoningParam,
    type Routing,
    type Widget,
  } from '@nuclia/core';
  import { BehaviorSubject, delay, filter, firstValueFrom, of } from 'rxjs';
  import { createEventDispatcher, onMount } from 'svelte';
  import { fly } from 'svelte/transition';
  import { IconButton } from '../../common';
  import globalCss from '../../common/global.css?inline';
  import { Viewer } from '../../components';
  import Chat from '../../components/answer/Chat.svelte';
  import {
    _,
    chatInput,
    chatPlaceholderDiscussion,
    chatPlaceholderInitial,
    DEFAULT_CHAT_PLACEHOLDER,
    filterExpression,
    preselectedFilters,
    reasoningParam,
    resetChat,
    routingParam,
    searchConfigId,
    widgetFeatures,
    widgetFeedback,
    widgetFilters,
    widgetImageRagStrategies,
    widgetRagStrategies,
    type WidgetFilters,
  } from '../../core';
  import { getApiErrors, initNuclia, resetNuclia } from '../../core/api';
  import { setLang } from '../../core/i18n';
  import {
    askQuestion,
    initAnswer,
    initChatHistoryPersistence,
    initEntitiesStore,
    initLabelStore,
    initMimeTypeStore,
    initPathsStore,
    initUsageTracking,
    initViewer,
  } from '../../core/stores/effects';
  import { injectCustomCss, loadFonts, loadSvgSprite, loadWidgetConfig, setCDN } from '../../core/utils';
  import FAB from './FAB.svelte';

  class Props {
    // Core API configuration
    backend = 'https://rag.progress.cloud/api';
    zone = 'europe-1';
    knowledgebox: any;
    lang?: string;
    cdn?: string;
    apikey?: string;
    account?: string;
    client = 'widget';
    kbstate: KBStates = 'PUBLISHED';
    features?: string;
    standalone = false;
    proxy = false;
    csspath?: string;
    id?: string;

    // Chat configuration
    prompt?: string;
    system_prompt?: string;
    rephrase_prompt?: string;
    generativemodel?: string;
    filters?: string;
    labelsets_excluded_from_filters?: string;
    preselected_filters?: string;
    filter_expression?: string;
    no_tracking = false;
    rag_strategies?: string;
    rag_images_strategies?: string;
    not_enough_data_message?: string;
    max_tokens?: number | string | undefined;
    max_output_tokens?: number | string | undefined;
    max_paragraphs?: number | string | undefined;
    query_prepend?: string;
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
    reasoning?: string;
    routing?: string;

    // Floating chat specific configuration
    fab_position: 'bottom-right' | 'bottom-left' = 'bottom-right';
    fab_size: 'small' | 'medium' | 'large' = 'medium';
    fab_offset_bottom = 24;
    fab_offset_side = 24;
    panel_width = 400;
    panel_height = 600;
  }

  let { ...componentProps } = $props();
  let config = $state(new Props());

  // Derived props with fallbacks
  let backend = $derived(componentProps.backend || config.backend);
  let zone = $derived(componentProps.zone || config.zone);
  let knowledgebox = $derived(componentProps.knowledgebox || config.knowledgebox);
  let lang = $derived(componentProps.lang || config.lang || window.navigator.language.split('-')[0] || 'en');
  let cdn = $derived(componentProps.cdn || config.cdn);
  let apikey = $derived(componentProps.apikey || config.apikey);
  let account = $derived(componentProps.account || config.account);
  let client = $derived(componentProps.client || config.client);
  let kbstate = $derived(componentProps.kbstate || config.kbstate);
  let features = $derived(componentProps.features || config.features);
  let standalone = $derived(componentProps.standalone || config.standalone);
  let proxy = $derived(componentProps.proxy || config.proxy);
  let csspath = $derived(componentProps.csspath || config.csspath);
  let id = $derived(componentProps.id || config.id);
  let prompt = $derived(componentProps.prompt || config.prompt);
  let system_prompt = $derived(componentProps.system_prompt || config.system_prompt);
  let rephrase_prompt = $derived(componentProps.rephrase_prompt || config.rephrase_prompt);
  let generativemodel = $derived(componentProps.generativemodel || config.generativemodel);
  let filters = $derived(componentProps.filters || config.filters);
  let labelsets_excluded_from_filters = $derived(
    componentProps.labelsets_excluded_from_filters || config.labelsets_excluded_from_filters,
  );
  let preselected_filters = $derived(componentProps.preselected_filters || config.preselected_filters);
  let filter_expression = $derived(componentProps.filter_expression || config.filter_expression);
  let no_tracking = $derived(componentProps.no_tracking || config.no_tracking);
  let rag_strategies = $derived(componentProps.rag_strategies || config.rag_strategies);
  let rag_images_strategies = $derived(componentProps.rag_images_strategies || config.rag_images_strategies);
  let not_enough_data_message = $derived(componentProps.not_enough_data_message || config.not_enough_data_message);
  let max_tokens = $derived(componentProps.max_tokens || config.max_tokens);
  let max_output_tokens = $derived(componentProps.max_output_tokens || config.max_output_tokens);
  let max_paragraphs = $derived(componentProps.max_paragraphs || config.max_paragraphs);
  let query_prepend = $derived(componentProps.query_prepend || config.query_prepend);
  let vectorset = $derived(componentProps.vectorset || config.vectorset);
  let chat_placeholder = $derived(componentProps.chat_placeholder || config.chat_placeholder || '');
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
  let reasoning = $derived(componentProps.reasoning || config.reasoning);
  let routing = $derived(componentProps.routing || config.routing);

  // Floating chat specific props
  let fab_position = $derived(componentProps.fab_position || config.fab_position);
  let fab_size = $derived(componentProps.fab_size || config.fab_size);
  let fab_offset_bottom = $derived(componentProps.fab_offset_bottom || config.fab_offset_bottom);
  let fab_offset_side = $derived(componentProps.fab_offset_side || config.fab_offset_side);
  let panel_width = $derived(componentProps.panel_width || config.panel_width);
  let panel_height = $derived(componentProps.panel_height || config.panel_height);

  // Internal state
  let _ragStrategies: RAGStrategy[] = [];
  let _ragImageStrategies: RAGImageStrategy[] = [];
  let _max_tokens: number | undefined;
  let _max_output_tokens: number | undefined;
  let _citation_threshold: number | undefined;
  let _rrf_boosting: number | undefined;
  let _max_paragraphs: number | undefined;
  let _reasoning: ReasoningParam | undefined;
  let _routing: Routing | undefined;
  let initHook: (n: Nuclia) => void = () => {};

  export function setInitHook(fn: (n: Nuclia) => void) {
    initHook = fn;
  }

  $effect(() => {
    let [initialPlaceholder, discussionPlaceholder] = chat_placeholder.split('|');
    chatPlaceholderInitial.set(initialPlaceholder || DEFAULT_CHAT_PLACEHOLDER);
    chatPlaceholderDiscussion.set(discussionPlaceholder || initialPlaceholder || DEFAULT_CHAT_PLACEHOLDER);
  });

  // Panel visibility state
  let panelOpen = $state(false);

  export function openPanel() {
    panelOpen = true;
  }

  export function closePanel() {
    panelOpen = false;
  }

  export function ask(question: string, reset = true, doNotTriggerSearch = false) {
    if (!panelOpen) {
      panelOpen = true;
    }
    if (doNotTriggerSearch) {
      if (reset) {
        resetChat.set();
      }
      chatInput.set(question);
    } else {
      askQuestion(question, reset).subscribe();
    }
  }

  export function setSearchConfiguration(id: string | undefined) {
    searchConfigId.set(id);
  }

  export const onError = getApiErrors();
  export const reset = () => resetNuclia();

  let _ready = new BehaviorSubject(false);
  const ready = _ready.asObservable().pipe(filter((r) => r));
  export const onReady = () => firstValueFrom(ready);
  let nucliaAPI: Nuclia;

  let _features: Widget.WidgetFeatures = {};
  let _securityGroups: string[] | undefined;
  let _filters: WidgetFilters = {};
  let _filter_expression: FilterExpression | undefined;

  const dispatch = createEventDispatcher();
  const dispatchCustomEvent = (name: string, detail: any) => {
    dispatch(name, detail);
  };

  let svgSprite: string = $state();
  let container: HTMLElement = $state();

  ready.pipe(delay(200)).subscribe(() => {
    initHook(nucliaAPI);
    if (_features.filter) {
      if (_filters.labels || _filters.labelFamilies) {
        initLabelStore(labelsets_excluded_from_filters);
      }
      if (_filters.entities) {
        initEntitiesStore();
      }
      if (_filters.mime) {
        initMimeTypeStore();
      }
      if (_filters.path) {
        initPathsStore();
      }
    }
    if (_features.debug) {
      nucliaAPI.events.dump().subscribe((data) => {
        dispatchCustomEvent('logs', data);
      });
    }
  });
  
  function onBackdropKeyup(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      closePanel();
    }
  }

  // Handle click outside panel to close
  function handleBackdropClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('floating-chat-backdrop')) {
      closePanel();
    }
  }

  // Handle escape key to close
  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && panelOpen) {
      closePanel();
    }
  }

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
      _ragImageStrategies = parseRAGImageStrategies(rag_images_strategies);
      _max_tokens = typeof max_tokens === 'string' ? parseInt(max_tokens, 10) : max_tokens;
      _max_output_tokens = typeof max_output_tokens === 'string' ? parseInt(max_output_tokens, 10) : max_output_tokens;
      _citation_threshold =
        typeof citation_threshold === 'string' ? parseFloat(citation_threshold) : citation_threshold;
      _rrf_boosting = typeof rrf_boosting === 'string' ? parseFloat(rrf_boosting) : rrf_boosting;
      _max_paragraphs = typeof max_paragraphs === 'string' ? parseInt(max_paragraphs, 10) : max_paragraphs;
      try {
        _filter_expression = filter_expression ? JSON.parse(filter_expression) : undefined;
      } catch (e) {
        console.log(`Invalid filter_expression`);
      }
      try {
        _reasoning = reasoning ? JSON.parse(reasoning) : undefined;
      } catch (e) {
        console.log(`Invalid reasoning parameter`);
      }
      try {
        _routing = routing ? JSON.parse(routing) : undefined;
      } catch (e) {
        console.log(`Invalid routing parameter`);
      }

      nucliaAPI = initNuclia(
        nucliaOptions,
        kbstate,
        {
          features: _features,
          prompt,
          system_prompt,
          rephrase_prompt,
          generative_model: generativemodel,
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
      widgetImageRagStrategies.set(_ragImageStrategies);
      widgetFeedback.set(feedback);

      if (preselected_filters) {
        preselectedFilters.set(preselected_filters);
      } else if (_filter_expression) {
        filterExpression.set(_filter_expression);
      }
      if (_reasoning) {
        reasoningParam.set(_reasoning);
      }
      if (_routing) {
        routingParam.set(_routing);
      }

      initAnswer();
      initViewer();
      initUsageTracking(no_tracking);
      if (_features.persistChatHistory) {
        initChatHistoryPersistence(id);
      }

      setLang(lang);

      loadFonts();
      loadSvgSprite().subscribe((sprite) => {
        svgSprite = sprite;
        // Mark widget as ready only after SVG sprite is loaded
        if (search_config_id) {
          searchConfigId.set(search_config_id);
        }
        _ready.next(true);
      });
      injectCustomCss(csspath, container);

      if (search_config_id && !svgSprite) {
        // If SVG is not yet loaded, set search_config_id early
        searchConfigId.set(search_config_id);
      }
    });

    // Add global keyboard listener
    document.addEventListener('keydown', handleKeydown);

    return () => {
      reset();
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  // Derive panel position style
  const panelPositionStyle = $derived(
    fab_position === 'bottom-right'
      ? `bottom: ${fab_offset_bottom}px; right: ${fab_offset_side}px;`
      : `bottom: ${fab_offset_bottom}px; left: ${fab_offset_side}px;`
  );
</script>

<svelte:element this={'style'}>{@html globalCss}</svelte:element>

<div
  bind:this={container}
  class="nuclia-widget floating-chat-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  <style src="../../common/common-style.css"></style>
  <style src="./FloatingChatWidget.css"></style>

  {#if $ready && !!svgSprite}
    {#if !panelOpen}
      <FAB
        position={fab_position}
        size={fab_size}
        offsetBottom={fab_offset_bottom}
        offsetSide={fab_offset_side}
        on:open={openPanel} />
    {:else}
      <div
        class="floating-chat-backdrop"
        onclick={handleBackdropClick}
        onkeyup={onBackdropKeyup}
        role="button"
        tabindex="0">
        <div
          class="floating-chat-panel"
          class:bottom-right={fab_position === 'bottom-right'}
          class:bottom-left={fab_position === 'bottom-left'}
          style="{panelPositionStyle} --panel-width: {panel_width}px; --panel-height: {panel_height}px;"
          transition:fly={{ y: 20, duration: 300 }}>
          <div class="chat-header">
            <span class="chat-title">Chat</span>
            <IconButton
              icon="cross"
              aspect="basic"
              size="small"
              on:click={closePanel}
              ariaLabel={$_('generic.close')} />
          </div>
          <Chat
            show={true}
            standaloneChat={true}
            fullscreen={false}
            height={'auto'}
            on:close={closePanel} />
        </div>
      </div>
    {/if}
  {/if}

  <Viewer />

  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>
