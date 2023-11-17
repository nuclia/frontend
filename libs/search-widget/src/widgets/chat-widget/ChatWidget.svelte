<svelte:options customElement="nuclia-chat" />

<script lang="ts">
  import { initNuclia, resetNuclia } from '../../core/api';
  import { onMount } from 'svelte';
  import { loadFonts, loadSvgSprite, setCDN } from '../../core/utils';
  import { setLang } from '../../core/i18n';
  import type { KBStates } from '@nuclia/core';
  import globalCss from '../../common/_global.scss?inline';
  import { initAnswer, initUsageTracking, initViewer, resetStatesAndEffects } from '../../core/stores/effects';
  import Chat from '../../components/answer/Chat.svelte';
  import { injectCustomCss } from '../../core/utils';
  import { preselectedFilters } from '../../core';

  export let backend = 'https://nuclia.cloud/api';
  export let zone = 'europe-1';
  export let knowledgebox;
  export let lang = '';
  export let cdn = '';
  export let apikey = '';
  export let kbslug = '';
  export let account = '';
  export let client = 'widget';
  export let state: KBStates = 'PUBLISHED';
  export let standalone = false;
  export let proxy = false;
  export let cssPath = '';
  export let prompt = '';
  export let preselected_filters = '';

  export let layout: 'inline' | 'fullscreen' = 'fullscreen';
  export let height = '';

  let showChat = layout === 'inline';

  export function openChat() {
    showChat = true;
  }

  export function closeChat() {
    showChat = false;
  }

  export const reset = () => {
    resetNuclia();
    resetStatesAndEffects();
  };

  let svgSprite: string;
  let container: HTMLElement;
  let ready = false;

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
        kbSlug: kbslug,
        account,
        standalone,
        proxy,
      },
      state,
      { prompt },
    );

    if (preselected_filters) {
      preselectedFilters.set(preselected_filters.split(','));
    }
    initAnswer();
    initViewer();
    initUsageTracking();

    lang = lang || window.navigator.language.split('-')[0] || 'en';
    setLang(lang);

    loadFonts();
    loadSvgSprite().subscribe((sprite) => (svgSprite = sprite));
    injectCustomCss(cssPath, container);

    ready = true;

    return () => reset();
  });
</script>

<svelte:element this="style">{@html globalCss}</svelte:element>

<div
  bind:this={container}
  class="nuclia-widget"
  data-version="__NUCLIA_DEV_VERSION__">
  {#if ready && !!svgSprite}
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
