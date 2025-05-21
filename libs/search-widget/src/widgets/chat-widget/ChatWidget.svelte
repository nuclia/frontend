<svelte:options customElement="nuclia-chat" />

<script lang="ts">
  import { run } from 'svelte/legacy';

  import { getApiErrors, getSearchConfig, initNuclia, resetNuclia } from '../../core/api';
  import { createEventDispatcher, onMount } from 'svelte';
  import { get_current_component } from 'svelte/internal';
  import { loadFonts, loadSvgSprite, loadWidgetConfig, setCDN } from '../../core/utils';
  import { setLang } from '../../core/i18n';
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
  import globalCss from '../../common/_global.scss?inline';
  import {
    askQuestion,
    initAnswer,
    initChatHistoryPersistence,
    initUsageTracking,
    initViewer,
  } from '../../core/stores/effects';
  import Chat from '../../components/answer/Chat.svelte';
  import { injectCustomCss } from '../../core/utils';
  import {
    askBackendConfig,
    chatPlaceholder,
    chatInput,
    findBackendConfig,
    preselectedFilters,
    widgetFeatures,
    widgetFeedback,
    widgetImageRagStrategies,
    widgetRagStrategies,
  } from '../../core';
  import { BehaviorSubject, delay, filter, firstValueFrom, of } from 'rxjs';
  import { Viewer } from '../../components';

  interface Props {
    backend?: string;
    zone?: string;
    knowledgebox: any;
    lang?: string;
    cdn?: string;
    apikey?: string;
    account?: string;
    client?: string;
    kbstate?: KBStates;
    features?: string;
    standalone?: boolean;
    proxy?: boolean;
    cssPath?: string;
    id?: string;
    prompt?: string;
    system_prompt?: string;
    rephrase_prompt?: string;
    generativemodel?: string;
    preselected_filters?: string;
    no_tracking?: boolean;
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
    feedback?: Widget.WidgetFeedback;
    copy_disclaimer?: string | undefined;
    metadata?: string | undefined;
    widget_id?: string | undefined;
    search_config_id?: string | undefined;
    layout?: 'inline' | 'fullscreen';
    height?: string;
  }

  let {
    backend = 'https://nuclia.cloud/api',
    zone = 'europe-1',
    knowledgebox,
    lang = $bindable(''),
    cdn = '',
    apikey = '',
    account = '',
    client = 'widget',
    kbstate = 'PUBLISHED',
    features = '',
    standalone = false,
    proxy = false,
    cssPath = '',
    id = '',
    prompt = '',
    system_prompt = '',
    rephrase_prompt = '',
    generativemodel = '',
    preselected_filters = '',
    no_tracking = false,
    rag_strategies = '',
    rag_images_strategies = '',
    not_enough_data_message = '',
    max_tokens = undefined,
    max_output_tokens = undefined,
    max_paragraphs = undefined,
    query_prepend = '',
    vectorset = '',
    chat_placeholder = '',
    audit_metadata = '',
    reranker = undefined,
    citation_threshold = undefined,
    rrf_boosting = undefined,
    feedback = 'answer',
    copy_disclaimer = undefined,
    metadata = undefined,
    widget_id = undefined,
    search_config_id = undefined,
    layout = 'inline',
    height = '',
  }: Props = $props();
  let _ragStrategies: RAGStrategy[] = [];
  let _ragImageStrategies: RAGImageStrategy[] = [];
  let _max_tokens: number | undefined;
  let _max_output_tokens: number | undefined;
  let _citation_threshold: number | undefined;
  let _rrf_boosting: number | undefined;
  let _max_paragraphs: number | undefined;

  run(() => {
    chatPlaceholder.set(chat_placeholder || 'answer.placeholder');
  });

  let showChat = $state(layout === 'inline');

  export function openChat() {
    showChat = true;
  }

  export function closeChat() {
    showChat = false;
  }

  export function ask(question: string, reset = true, doNotTriggerSearch = false) {
    if (doNotTriggerSearch) {
      chatInput.set(question);
    } else {
      askQuestion(question, reset).subscribe();
    }
  }

  export const onError = getApiErrors();

  export const reset = () => resetNuclia();

  let _ready = new BehaviorSubject(false);
  const ready = _ready.asObservable().pipe(filter((r) => r));
  export const onReady = () => firstValueFrom(ready);
  let nucliaAPI: Nuclia;

  let _features: Widget.WidgetFeatures = {};

  const dispatch = createEventDispatcher();
  const dispatchCustomEvent = (name: string, detail: any) => {
    dispatch(name, detail);
  };

  let svgSprite: string = $state();
  let container: HTMLElement = $state();
  const component = get_current_component();

  ready.pipe(delay(200)).subscribe(() => {
    // any feature that calls the Nuclia API immediately at init time must be done here
    if (_features.debug) {
      nucliaAPI.events.dump().subscribe((data) => {
        dispatchCustomEvent('logs', data);
      });
    }
  });

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
    (widget_id ? loadWidgetConfig(widget_id, nucliaOptions) : of({})).subscribe((config) => {
      if (Object.keys(config).length > 0) {
        component.$set(config);
      }
      if (cdn) {
        setCDN(cdn);
      }
      _features = (features ? features.split(',').filter((feature) => !!feature) : []).reduce(
        (acc, current) => ({ ...acc, [current as keyof Widget.WidgetFeatures]: true }),
        {},
      );

      _ragStrategies = parseRAGStrategies(rag_strategies);
      _ragImageStrategies = parseRAGImageStrategies(rag_images_strategies);
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
        },
        no_tracking,
      );

      // Setup widget in the store
      widgetFeatures.set(_features);
      widgetRagStrategies.set(_ragStrategies);
      widgetImageRagStrategies.set(_ragImageStrategies);
      widgetFeedback.set(feedback);

      if (preselected_filters) {
        preselectedFilters.set(preselected_filters);
      }

      initAnswer();
      initViewer();
      initUsageTracking(no_tracking);
      if (_features.persistChatHistory) {
        initChatHistoryPersistence(id);
      }

      lang = lang || window.navigator.language.split('-')[0] || 'en';
      setLang(lang);

      loadFonts();
      loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
      injectCustomCss(cssPath, container);

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

    return () => reset();
  });
</script>

<svelte:element this={'style'}>{@html globalCss}</svelte:element>

<div
  bind:this={container}
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if $ready && !!svgSprite}
    <Chat
      show={showChat}
      standaloneChat={true}
      fullscreen={layout === 'fullscreen'}
      height={height || undefined}
      on:close={closeChat} />
  {/if}

  <Viewer />

  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style
  lang="scss"
  src="./ChatWidget.scss"></style>
