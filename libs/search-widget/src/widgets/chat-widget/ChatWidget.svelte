<svelte:options customElement="nuclia-chat" />

<script lang="ts">
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { getRAGStrategies, loadFonts, loadSvgSprite, setCDN } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import type { KBStates, RAGStrategy } from '@nuclia/core';
  import globalCss from '../../common/_global.scss?inline';
  import { initAnswer, initUsageTracking, initViewer } from '../../core/stores/effects';
  import Chat from '../../components/answer/Chat.svelte';
  import { injectCustomCss } from '../../core/utils';
  import { preselectedFilters, widgetRagStrategies } from '../../core';
  import { BehaviorSubject, filter, firstValueFrom } from 'rxjs';

  export let backend = 'https://nuclia.cloud/api';
  export let zone = 'europe-1';
  export let knowledgebox;
  export let lang = '';
  export let cdn = '';
  export let apikey = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';
  export let standalone = false;
  export let proxy = false;
  export let cssPath = '';
  export let prompt = '';
  export let preselected_filters = '';
  export let no_tracking = false;
  export let rag_strategies = '';
  export let rag_field_ids = '';

  export let layout: 'inline' | 'fullscreen' = 'fullscreen';
  export let height = '';
  let _ragStrategies: RAGStrategy[] = [];

  let showChat = layout === 'inline';

  export function openChat() {
    showChat = true;
  }

  export function closeChat() {
    showChat = false;
  }

  export const reset = () => resetNuclia();

  let _ready = new BehaviorSubject(false);
  const ready = _ready.asObservable().pipe(filter((r) => r));
  export const onReady = () => firstValueFrom(ready);

  let svgSprite: string;
  let container: HTMLElement;

  onMount(() => {
    if (cdn) {
      setCDN(cdn);
    }

    initNuclia(
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
      { prompt },
      no_tracking,
    );

    if (preselected_filters) {
      preselectedFilters.set(preselected_filters.split(','));
    }

    _ragStrategies = getRAGStrategies(rag_strategies, rag_field_ids);
    widgetRagStrategies.set(_ragStrategies);

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

  <div
    id="nuclia-glyphs-sprite"
    hidden>
    {@html svgSprite}
  </div>
</div>

<style
  lang="scss"
  src="./ChatWidget.scss"></style>
