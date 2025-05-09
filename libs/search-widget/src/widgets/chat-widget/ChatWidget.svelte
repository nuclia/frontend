<svelte:options customElement="nuclia-chat" />

<script lang="ts">
  import { getApiErrors, initNuclia, resetNuclia } from '../../core/api';
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
    chatPlaceholder,
    chatInput,
    preselectedFilters,
    widgetFeatures,
    widgetFeedback,
    widgetImageRagStrategies,
    widgetRagStrategies,
  } from '../../core';
  import { BehaviorSubject, delay, filter, firstValueFrom, of } from 'rxjs';
  import { Viewer } from '../../components';

  export let backend = 'https://nuclia.cloud/api';
  export let zone = 'europe-1';
  export let knowledgebox;
  export let lang = '';
  export let cdn = '';
  export let apikey = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';
  export let features = '';
  export let standalone = false;
  export let proxy = false;
  export let cssPath = '';
  export let id = '';
  export let prompt = '';
  export let system_prompt = '';
  export let rephrase_prompt = '';
  export let generativemodel = '';
  export let preselected_filters = '';
  export let no_tracking = false;
  export let rag_strategies = '';
  export let rag_images_strategies = '';
  export let not_enough_data_message = '';
  export let max_tokens: number | string | undefined = undefined;
  export let max_output_tokens: number | string | undefined = undefined;
  export let max_paragraphs: number | string | undefined = undefined;
  export let query_prepend = '';
  export let vectorset = '';
  export let chat_placeholder = '';
  export let audit_metadata = '';
  export let reranker: Reranker | undefined = undefined;
  export let citation_threshold: number | string | undefined = undefined;
  export let rrf_boosting: number | string | undefined = undefined;
  export let feedback: Widget.WidgetFeedback = 'answer';
  export let copy_disclaimer: string | undefined = undefined;
  export let metadata: string | undefined = undefined;
  export let widget_id: string | undefined = undefined;

  export let layout: 'inline' | 'fullscreen' = 'inline';
  export let height = '';
  let _ragStrategies: RAGStrategy[] = [];
  let _ragImageStrategies: RAGImageStrategy[] = [];
  let _max_tokens: number | undefined;
  let _max_output_tokens: number | undefined;
  let _citation_threshold: number | undefined;
  let _rrf_boosting: number | undefined;
  let _max_paragraphs: number | undefined;

  $: {
    chatPlaceholder.set(chat_placeholder || 'answer.placeholder');
  }

  let showChat = layout === 'inline';

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

  let svgSprite: string;
  let container: HTMLElement;
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
        state,
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

      _ready.next(true);
    });

    return () => reset();
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

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
