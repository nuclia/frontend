<svelte:options customElement="nuclia-chat" />

<script lang="ts">
  import { initNuclia, resetNuclia } from '../../core/api';
  import { createEventDispatcher, onMount } from 'svelte';
  import { getRAGImageStrategies, getRAGStrategies, loadFonts, loadSvgSprite, setCDN } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import type { KBStates, Nuclia, RAGImageStrategy, RAGStrategy, WidgetFeatures } from '@nuclia/core';
  import globalCss from '../../common/_global.scss?inline';
  import { askQuestion, initAnswer, initUsageTracking, initViewer } from '../../core/stores/effects';
  import Chat from '../../components/answer/Chat.svelte';
  import { injectCustomCss } from '../../core/utils';
  import { preselectedFilters, widgetFeatures, widgetImageRagStrategies, widgetRagStrategies } from '../../core';
  import { BehaviorSubject, delay, filter, firstValueFrom } from 'rxjs';
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
  export let prompt = '';
  export let preselected_filters = '';
  export let no_tracking = false;
  export let rag_strategies = '';
  export let rag_image_strategies = '';
  export let max_tokens: number | undefined = undefined;
  export let query_prepend = '';
  export let vectorset = '';

  export let layout: 'inline' | 'fullscreen' = 'inline';
  export let height = '';
  let _ragStrategies: RAGStrategy[] = [];
  let _ragImageStrategies: RAGImageStrategy[] = [];

  let showChat = layout === 'inline';

  export function openChat() {
    showChat = true;
  }

  export function closeChat() {
    showChat = false;
  }

  export function ask(question: string, reset = true) {
    askQuestion(question, reset).subscribe();
  }

  export const reset = () => resetNuclia();

  let _ready = new BehaviorSubject(false);
  const ready = _ready.asObservable().pipe(filter((r) => r));
  export const onReady = () => firstValueFrom(ready);
  let nucliaAPI: Nuclia;

  let _features: WidgetFeatures = {};

  const dispatch = createEventDispatcher();
  const dispatchCustomEvent = (name: string, detail: any) => {
    dispatch(name, detail);
  };

  let svgSprite: string;
  let container: HTMLElement;

  ready.pipe(delay(200)).subscribe(() => {
    // any feature that calls the Nuclia API immediately at init time must be done here
    if (_features.dumpLog) {
      nucliaAPI.events.dump().subscribe((data) => {
        dispatchCustomEvent('logs', data);
      });
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

    _ragStrategies = getRAGStrategies(rag_strategies);
    _ragImageStrategies = getRAGImageStrategies(rag_image_strategies);

    nucliaAPI = initNuclia(
      {
        backend,
        zone,
        knowledgeBox: knowledgebox,
        client,
        apiKey: apikey,
        account,
        accountId: account,
        standalone,
        proxy,
      },
      state,
      { prompt, max_tokens, query_prepend, vectorset, },
      no_tracking,
    );

    // Setup widget in the store
    widgetFeatures.set(_features);
    widgetRagStrategies.set(_ragStrategies);
    widgetImageRagStrategies.set(_ragImageStrategies);

    if (preselected_filters) {
      preselectedFilters.set(preselected_filters);
    }

    initAnswer();
    initViewer();
    initUsageTracking(no_tracking);

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
    injectCustomCss(cssPath, container);

    _ready.next(true);

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
